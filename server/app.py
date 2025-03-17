from flask import Flask, request, jsonify
from flask_cors import CORS
from notion_client import Client
from loguru import logger
import os
from dotenv import load_dotenv
import sys
import traceback
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure logger
logger.remove()  # Remove default handler
logger.add(
    "server.log",
    rotation="500 MB",
    level="DEBUG",
    format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>"
)
logger.add(sys.stderr, level="INFO")  # Also log to console

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize Notion client
notion = Client(auth=os.getenv("NOTION_API_KEY"))
DATABASE_ID = os.getenv("NOTION_DATABASE_ID")

class NotionError(Exception):
    """Custom exception for Notion-related errors"""
    pass

def validate_notion_config():
    """Validate Notion configuration and database access"""
    if not os.getenv("NOTION_API_KEY"):
        raise NotionError("Notion API key is not configured")
    if not DATABASE_ID:
        raise NotionError("Notion database ID is not configured")
    
    try:
        # Test database access
        notion.databases.retrieve(DATABASE_ID)
        logger.info("Successfully connected to Notion database")
    except Exception as e:
        logger.error(f"Failed to connect to Notion database: {str(e)}")
        raise NotionError(f"Failed to connect to Notion database: {str(e)}")

def create_notion_page(data):
    """Create a page in Notion database with error handling"""
    try:
        # Start with required properties
        properties = {
            "Name": {
                "title": [{
                    "text": {"content": data["name"] or "Unnamed Guest"}
                }]
            },
            "Day": {
                "select": {
                    "name": data["day"].capitalize()
                }
            },
            "Guest Type": {
                "select": {
                    "name": data["guest_type"]
                }
            }
        }

        # Add email only if not empty
        if data.get("email"):
            properties["Email"] = {"email": data["email"]}

        # Add phone only if not empty
        if data.get("phone"):
            properties["Phone"] = {"phone_number": data["phone"]}

        # Add about only if not empty
        if data.get("about"):
            properties["About"] = {
                "rich_text": [{
                    "text": {"content": data["about"]}
                }]
            }

        if data.get("primary_contact"):
            properties["Primary Contact"] = {
                "rich_text": [{"text": {"content": data["primary_contact"]}}]
            }

        if data.get("guests"):
            properties["Guests"] = {
                "rich_text": [{"text": {"content": ", ".join(data["guests"])}}]
            }

        response = notion.pages.create(
            parent={"database_id": DATABASE_ID},
            properties=properties
        )
        
        logger.info(f"Successfully created Notion page for {data['name']}")
        return response
    except Exception as e:
        logger.error(f"Failed to create Notion page: {str(e)}\nData: {data}")
        raise NotionError(f"Failed to create Notion page: {str(e)}")

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint that also verifies Notion connectivity"""
    try:
        validate_notion_config()
        return jsonify({
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "notion_connection": "ok"
        })
    except NotionError as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 503

@app.route("/api/rsvp", methods=["POST"])
def handle_rsvp():
    """Handle RSVP submission"""
    try:
        data = request.get_json()
        logger.debug(f"Received RSVP request: {data}")

        if not data:
            raise ValueError("No data provided")

        required_fields = ["day", "formData"]
        if not all(field in data for field in required_fields):
            missing_fields = [field for field in required_fields if field not in data]
            raise ValueError(f"Missing required fields: {missing_fields}")

        if not isinstance(data["formData"], list) or len(data["formData"]) == 0:
            raise ValueError("formData must be a non-empty array")

        # Process primary contact
        primary_contact = data["formData"][0]
        required_contact_fields = ["name", "email", "phone", "about"]
        if not all(field in primary_contact for field in required_contact_fields):
            missing_fields = [field for field in required_contact_fields if field not in primary_contact]
            raise ValueError(f"Missing required fields for primary contact: {missing_fields}")

        # Create primary contact entry
        primary_data = {
            **primary_contact,
            "day": data["day"],
            "guest_type": "Primary",
            "guests": [friend.get("name", "Unknown") for friend in data["formData"][1:]]
        }
        primary_response = create_notion_page(primary_data)

        # Process friends
        friend_responses = []
        for friend in data["formData"][1:]:
            friend_data = {
                "name": friend.get("name", "Unknown"),
                "email": friend.get("email", ""),
                "phone": friend.get("phone", ""),
                "about": friend.get("about", ""),
                "day": data["day"],
                "guest_type": "Friend",
                "Primary Contact": {
                    "rich_text": [{
                        "text": {"content": primary_contact["name"]}
                    }]
                }
            }
            friend_response = create_notion_page(friend_data)
            friend_responses.append(friend_response)

        logger.info(f"Successfully processed RSVP for {primary_contact['name']} and {len(friend_responses)} friends")
        return jsonify({
            "success": True,
            "message": "RSVP submitted successfully",
            "data": {
                "primary": primary_response,
                "friends": friend_responses
            }
        })

    except ValueError as e:
        logger.warning(f"Validation error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Validation error",
            "details": str(e)
        }), 400

    except NotionError as e:
        logger.error(f"Notion error: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Notion API error",
            "details": str(e)
        }), 502

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}\n{traceback.format_exc()}")
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "details": str(e)
        }), 500

# Initialize Notion configuration on import
try:
    validate_notion_config()
except NotionError as e:
    logger.error(f"Failed to initialize Notion: {str(e)}")
    # Don't exit here since Gunicorn would restart the worker

if __name__ == "__main__":
    # For local development only
    port = int(os.getenv("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
