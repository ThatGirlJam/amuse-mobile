"""
Development server entry point for facial analysis API
"""

import os
from dotenv import load_dotenv
from app import create_app

load_dotenv()

app = create_app()

if __name__ == "__main__":
    host = os.getenv("FLASK_HOST", "0.0.0.0")
    port = int(os.getenv("FLASK_PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"

    print(
        f"""
    ╔═══════════════════════════════════════════╗
    ║  Facial Analysis API - Development Server ║
    ╚═══════════════════════════════════════════╝

    Server running at: http://{host}:{port}
    Health check: http://{host}:{port}/api/health

    Press CTRL+C to stop the server
    """
    )

    # Run development server
    app.run(host=host, port=port, debug=debug)
