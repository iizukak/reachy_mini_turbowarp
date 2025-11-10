#!/usr/bin/env python3
"""
Simple HTTP server to serve the Scratch extension
This server handles CORS to allow TurboWarp to load the extension
"""

import http.server
import socketserver
import os
from pathlib import Path

PORT = 3000

class CORSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP Request Handler with CORS support"""

    def end_headers(self):
        # CORSヘッダーを追加
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        """Handle OPTIONS request for CORS preflight"""
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        """Log server messages with color"""
        print(f"\033[92m[Server]\033[0m {format % args}")


def main():
    # 現在のディレクトリに移動
    script_dir = Path(__file__).parent
    os.chdir(script_dir)

    print("\n" + "="*60)
    print("  Reachy Mini Scratch Extension Server")
    print("="*60)
    print(f"\n🚀 Server starting on http://localhost:{PORT}")
    print(f"📁 Serving files from: {script_dir}")
    print("\n📝 TurboWarpでの使い方:")
    print("   1. TurboWarpを開く")
    print("   2. 左下の「拡張機能を追加」をクリック")
    print("   3. 一番下の「カスタム拡張機能」を選択")
    print(f"   4. このURLを入力: http://localhost:{PORT}/reachy-mini-extension.js")
    print("\n⚠️  注意: Reachy Mini daemon (localhost:8000) が起動している必要があります")
    print("\n停止するには Ctrl+C を押してください")
    print("="*60 + "\n")

    try:
        with socketserver.TCPServer(("", PORT), CORSRequestHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n👋 Server stopped.")
    except OSError as e:
        if e.errno == 98:
            print(f"\n❌ Error: Port {PORT} is already in use.")
            print(f"   別のプロセスがポート{PORT}を使用しています。")
            print("   他のプロセスを停止するか、別のポートを使用してください。")
        else:
            raise


if __name__ == "__main__":
    main()
