from flask import Flask
from flask import request, jsonify
from flask_cors import CORS
import os
import sqlite3

app = Flask(__name__)
CORS(app)


def check_password():
    return request.headers.get("X-Admin-Password") == os.environ.get("ADMIN_PASSWORD")

conn = sqlite3.connect("bridge.db")
conn.execute("""
    CREATE TABLE IF NOT EXISTS suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        opportunity_name TEXT,
        organization TEXT,
        official_website TEXT,
        category TEXT,
        eligible_grades TEXT,
        eligible_ages TEXT,
        gender TEXT,
        cost TEXT,
        location TEXT,
        time_of_year TEXT,
        season TEXT,
        deadline TEXT,
        status TEXT DEFAULT "pending"
        ) 
    """)

conn.commit()
conn.close()

@app.route("/")
def home():
    return "Ahoy, the Bridge backend is alive!"

@app.route("/api/suggestions", methods=["POST"])
def suggest():
    data = request.form
    print("New Opportunity Suggestion:", data)

    db = sqlite3.connect("bridge.db")
    db.execute(""" 
INSERT INTO suggestions (
opportunity_name, organization, official_website, category, eligible_grades, eligible_ages, gender, cost, location, time_of_year, season, deadline
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""",(
    data.get("Opportunity"),
    data.get("Organization"),
    data.get("Website"),
    data.get("Category"),
    data.get("Grades"),
    data.get("Age"),
    data.get("Gender"),
    data.get("Cost"),
    data.get("Location"),
    data.get("Time"),
    data.get("Season"),
    data.get("Deadline"),
))

    db.commit()
    db.close()

    return jsonify({"message": "Suggestion received!"}), 201

@app.route("/api/suggestions", methods=["GET"])
def list_suggestions():
    if not check_password():
        return jsonify({"error": "Wrong password"}), 401

    db = sqlite3.connect("bridge.db")
    db.row_factory = sqlite3.Row

    rows = db.execute(
        "SELECT * FROM suggestions WHERE status = 'pending'"
    ).fetchall()

    db.close()
    return jsonify([dict(row) for row in rows])

@app.route("/api/opportunities", methods=["GET"])
def list_opportunities():
    db = sqlite3.connect("bridge.db")
    db.row_factory = sqlite3.Row

    rows = db.execute(
        "SELECT * FROM suggestions WHERE status = 'approved'"
    ).fetchall()

    db.close()
    return jsonify([dict(row) for row in rows])

@app.route("/api/suggestions/<int:suggestion_id>/approve", methods=["POST"])
def approve_suggestion(suggestion_id):
    if not check_password():
        return jsonify({"error": "Wrong password"}), 401

    db = sqlite3.connect("bridge.db")
    db.execute(
        "UPDATE suggestions SET status = 'approved' WHERE id = ?",
        (suggestion_id,)
    )
    db.commit()
    db.close()
    return jsonify({"message": "Approved!"})

@app.route("/api/suggestions/<int:suggestion_id>/reject", methods=["POST"])
def reject_suggestion(suggestion_id):
    if not check_password():
        return jsonify({"error": "Wrong password"}), 401

    db = sqlite3.connect("bridge.db")
    db.execute(
        "UPDATE suggestions SET status = 'rejected' WHERE id = ?",
        (suggestion_id,)
    )
    db.commit()
    db.close()
    return jsonify({"message": "Rejected!"})

@app.route("/api/suggestions/<int:suggestion_id>", methods=["DELETE"])
def delete_suggestion(suggestion_id):
    if not check_password():
        return jsonify({"error": "Wrong password"}), 401

    db = sqlite3.connect("bridge.db")
    db.execute("DELETE FROM suggestions WHERE id = ?", (suggestion_id,))
    db.commit()
    db.close()
    return jsonify({"message": "Deleted!"})

if __name__ == "__main__":
    app.run(debug=True)