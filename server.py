#!/usr/bin/env python3
"""
GTA Vice City WebAssembly - Local Test & Development Server
Serves static assets with appropriate MIME types and CORS headers.
"""

import http.server
import socketserver
import os
import sys
import io

DEFAULT_PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class ViceCityHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Resource-Policy', 'cross-origin')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_head(self):
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path) or 'Range' not in self.headers:
            return super().send_head()

        range_header = self.headers.get('Range').strip()
        if not range_header.startswith('bytes='):
            return super().send_head()

        total_length = os.path.getsize(path)
        try:
            range_val = range_header[6:].split('-')
            start = int(range_val[0]) if range_val[0] else 0
            end = int(range_val[1]) if range_val[1] else total_length - 1
            if start >= total_length or end >= total_length or start > end:
                self.send_error(416, "Requested Range Not Satisfiable")
                return None

            content_length = end - start + 1
            self.send_response(206)
            self.send_header('Content-Type', self.guess_type(path))
            self.send_header('Content-Range', f'bytes {start}-{end}/{total_length}')
            self.send_header('Content-Length', str(content_length))
            self.send_header('Accept-Ranges', 'bytes')
            self.end_headers()

            f = open(path, 'rb')
            f.seek(start)
            return io.BytesIO(f.read(content_length))
        except Exception:
            return super().send_head()

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        mime_types = {
            '.wasm': 'application/wasm',
            '.js': 'application/javascript',
            '.mjs': 'application/javascript',
            '.list': 'text/plain',
            '.mp3': 'audio/mpeg',
            '.txd': 'application/octet-stream',
            '.dff': 'application/octet-stream',
            '.col': 'application/octet-stream',
            '.dir': 'application/octet-stream',
            '.dat': 'application/octet-stream',
            '.ide': 'application/octet-stream',
            '.ipl': 'application/octet-stream',
            '.ttf': 'font/ttf',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
        }
        if ext in mime_types:
            return mime_types[ext]
        return super().guess_type(path)

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    
    # Check if gtavc-assets exists locally
    assets_dir = os.path.join(DIRECTORY, 'gtavc-assets')
    has_assets = os.path.isdir(assets_dir)
    
    print("=" * 60)
    print("  GTA Vice City WebAssembly - Local Development Server")
    print("=" * 60)
    print(f"  Server URL: http://127.0.0.1:{port}/index.html")
    print(f"  Engine URL: http://127.0.0.1:{port}/engine.html")
    if has_assets:
        print("  Self-Hosted Assets: DETECTED ('gtavc-assets/local' ready)")
    else:
        print("  Self-Hosted Assets: NOT DETECTED")
    print("=" * 60)
    print("Press Ctrl+C to stop the server.\n")

    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', port), ViceCityHTTPHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

