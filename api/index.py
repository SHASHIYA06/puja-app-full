import sys
import os

# Add root directory to sys.path so backend module can be imported
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app import app

# Serverless entry point for Vercel
app = app
