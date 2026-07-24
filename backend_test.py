#!/usr/bin/env python3
"""
Backend API Tests for LearnWithAli Math Game
Tests all endpoints with happy path and validation scenarios
"""

import requests
import json
import sys

# Base URL from .env
BASE_URL = "http://localhost:3000/api"

def print_test(name, passed, details=""):
    """Print test result"""
    status = "[PASS]" if passed else "[FAIL]"
    print(f"{status}: {name}")
    if details:
        print(f"   {details}")
    print()

def check_no_mongo_id(data, path=""):
    """Recursively check that no _id field exists in response"""
    if isinstance(data, dict):
        if "_id" in data:
            return False, f"Found _id at {path}"
        for key, value in data.items():
            result, msg = check_no_mongo_id(value, f"{path}.{key}")
            if not result:
                return False, msg
    elif isinstance(data, list):
        for i, item in enumerate(data):
            result, msg = check_no_mongo_id(item, f"{path}[{i}]")
            if not result:
                return False, msg
    return True, ""

def test_create_profile():
    """Test 1: POST /api/profile with valid data"""
    print("=" * 60)
    print("TEST 1: Create Profile (POST /api/profile)")
    print("=" * 60)
    
    try:
        payload = {
            "name": "Ali",
            "grade": 4,
            "avatar": "🦊"
        }
        
        response = requests.post(f"{BASE_URL}/profile", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        # Check status code
        if response.status_code != 200:
            print_test("Create profile - status code", False, f"Expected 200, got {response.status_code}")
            return None
        
        data = response.json()
        
        # Check structure
        if "user" not in data or "progress" not in data:
            print_test("Create profile - response structure", False, "Missing 'user' or 'progress' key")
            return None
        
        user = data["user"]
        
        # Check user fields
        required_fields = ["id", "name", "grade", "avatar", "totalCoins", "currentStreak"]
        missing = [f for f in required_fields if f not in user]
        if missing:
            print_test("Create profile - user fields", False, f"Missing fields: {missing}")
            return None
        
        # Check values
        checks = [
            (user["name"] == "Ali", f"name should be 'Ali', got '{user['name']}'"),
            (user["grade"] == 4, f"grade should be 4, got {user['grade']}"),
            (user["avatar"] == "🦊", f"avatar should be '🦊', got '{user['avatar']}'"),
            (user["totalCoins"] == 0, f"totalCoins should be 0, got {user['totalCoins']}"),
            (user["currentStreak"] == 0, f"currentStreak should be 0, got {user['currentStreak']}"),
            (isinstance(data["progress"], list), f"progress should be a list"),
            (len(data["progress"]) == 0, f"progress should be empty initially"),
        ]
        
        for check, msg in checks:
            if not check:
                print_test("Create profile - field values", False, msg)
                return None
        
        # Check no _id
        no_id, id_msg = check_no_mongo_id(data)
        if not no_id:
            print_test("Create profile - no _id leak", False, id_msg)
            return None
        
        print_test("Create profile", True, f"User created with id: {user['id']}")
        return user["id"]
        
    except Exception as e:
        print_test("Create profile", False, f"Exception: {str(e)}")
        return None

def test_get_profile(user_id):
    """Test 2: GET /api/profile/:id"""
    print("=" * 60)
    print(f"TEST 2: Get Profile (GET /api/profile/{user_id})")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/profile/{user_id}", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            print_test("Get profile - status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        # Check structure
        if "user" not in data or "progress" not in data:
            print_test("Get profile - response structure", False, "Missing 'user' or 'progress' key")
            return False
        
        user = data["user"]
        
        # Check user id matches
        if user.get("id") != user_id:
            print_test("Get profile - user id", False, f"Expected id {user_id}, got {user.get('id')}")
            return False
        
        # Check no _id
        no_id, id_msg = check_no_mongo_id(data)
        if not no_id:
            print_test("Get profile - no _id leak", False, id_msg)
            return False
        
        print_test("Get profile", True, f"Retrieved user with {len(data['progress'])} progress entries")
        return True
        
    except Exception as e:
        print_test("Get profile", False, f"Exception: {str(e)}")
        return False

def test_complete_level_first(user_id):
    """Test 3: POST /api/complete-level (first time, level 1)"""
    print("=" * 60)
    print("TEST 3: Complete Level 1 First Time (POST /api/complete-level)")
    print("=" * 60)
    
    try:
        payload = {
            "userId": user_id,
            "worldId": "mult",
            "levelNumber": 1,
            "score": 6,
            "total": 6,
            "coinsEarned": 34,
            "stars": 3,
            "timeSec": 20
        }
        
        response = requests.post(f"{BASE_URL}/complete-level", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            print_test("Complete level 1 - status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        user = data.get("user", {})
        progress = data.get("progress", [])
        
        # Check totalCoins increased
        if user.get("totalCoins") != 34:
            print_test("Complete level 1 - totalCoins", False, f"Expected 34, got {user.get('totalCoins')}")
            return False
        
        # Check currentStreak
        if user.get("currentStreak") != 1:
            print_test("Complete level 1 - currentStreak", False, f"Expected 1, got {user.get('currentStreak')}")
            return False
        
        # Check progress entry exists
        level_progress = [p for p in progress if p.get("worldId") == "mult" and p.get("levelNumber") == 1]
        if not level_progress:
            print_test("Complete level 1 - progress entry", False, "No progress entry found for mult level 1")
            return False
        
        entry = level_progress[0]
        if entry.get("stars") != 3:
            print_test("Complete level 1 - stars", False, f"Expected 3 stars, got {entry.get('stars')}")
            return False
        
        # Check no _id
        no_id, id_msg = check_no_mongo_id(data)
        if not no_id:
            print_test("Complete level 1 - no _id leak", False, id_msg)
            return False
        
        print_test("Complete level 1 first time", True, f"Coins: {user['totalCoins']}, Streak: {user['currentStreak']}, Stars: {entry['stars']}")
        return True
        
    except Exception as e:
        print_test("Complete level 1 first time", False, f"Exception: {str(e)}")
        return False

def test_complete_level_replay(user_id):
    """Test 4: POST /api/complete-level (replay level 1 with lower score)"""
    print("=" * 60)
    print("TEST 4: Replay Level 1 with Lower Score")
    print("=" * 60)
    
    try:
        payload = {
            "userId": user_id,
            "worldId": "mult",
            "levelNumber": 1,
            "score": 4,
            "total": 6,
            "coinsEarned": 30,
            "stars": 1,
            "timeSec": 25
        }
        
        response = requests.post(f"{BASE_URL}/complete-level", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            print_test("Replay level 1 - status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        user = data.get("user", {})
        progress = data.get("progress", [])
        
        # Check totalCoins increased again (should be 34 + 30 = 64)
        if user.get("totalCoins") != 64:
            print_test("Replay level 1 - totalCoins", False, f"Expected 64 (34+30), got {user.get('totalCoins')}")
            return False
        
        # Check progress entry - stars should stay at 3 (max)
        level_progress = [p for p in progress if p.get("worldId") == "mult" and p.get("levelNumber") == 1]
        if not level_progress:
            print_test("Replay level 1 - progress entry", False, "No progress entry found")
            return False
        
        entry = level_progress[0]
        if entry.get("stars") != 3:
            print_test("Replay level 1 - stars kept max", False, f"Expected stars to stay at 3, got {entry.get('stars')}")
            return False
        
        print_test("Replay level 1 with lower score", True, f"Stars kept at max (3), coins added (total: {user['totalCoins']})")
        return True
        
    except Exception as e:
        print_test("Replay level 1 with lower score", False, f"Exception: {str(e)}")
        return False

def test_complete_level_2(user_id):
    """Test 5: POST /api/complete-level (level 2)"""
    print("=" * 60)
    print("TEST 5: Complete Level 2")
    print("=" * 60)
    
    try:
        payload = {
            "userId": user_id,
            "worldId": "mult",
            "levelNumber": 2,
            "score": 5,
            "total": 6,
            "coinsEarned": 30,
            "stars": 2,
            "timeSec": 22
        }
        
        response = requests.post(f"{BASE_URL}/complete-level", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            print_test("Complete level 2 - status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        progress = data.get("progress", [])
        
        # Check progress now has 2 entries
        mult_progress = [p for p in progress if p.get("worldId") == "mult"]
        if len(mult_progress) != 2:
            print_test("Complete level 2 - progress count", False, f"Expected 2 progress entries, got {len(mult_progress)}")
            return False
        
        # Check level 2 entry exists
        level2 = [p for p in progress if p.get("worldId") == "mult" and p.get("levelNumber") == 2]
        if not level2:
            print_test("Complete level 2 - level 2 entry", False, "No progress entry for level 2")
            return False
        
        print_test("Complete level 2", True, f"Progress now has {len(mult_progress)} entries for mult world")
        return True
        
    except Exception as e:
        print_test("Complete level 2", False, f"Exception: {str(e)}")
        return False

def test_leaderboard(user_id):
    """Test 6: GET /api/leaderboard"""
    print("=" * 60)
    print("TEST 6: Get Leaderboard (GET /api/leaderboard)")
    print("=" * 60)
    
    try:
        response = requests.get(f"{BASE_URL}/leaderboard", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 200:
            print_test("Leaderboard - status code", False, f"Expected 200, got {response.status_code}")
            return False
        
        data = response.json()
        
        if "leaderboard" not in data:
            print_test("Leaderboard - response structure", False, "Missing 'leaderboard' key")
            return False
        
        leaderboard = data["leaderboard"]
        
        # Check our user is in leaderboard
        our_user = [u for u in leaderboard if u.get("id") == user_id]
        if not our_user:
            print_test("Leaderboard - user present", False, f"User {user_id} not found in leaderboard")
            return False
        
        user_entry = our_user[0]
        
        # Check totalCoins is correct (should be 94: 34 + 30 + 30)
        expected_coins = 94
        if user_entry.get("totalCoins") != expected_coins:
            print_test("Leaderboard - totalCoins", False, f"Expected {expected_coins}, got {user_entry.get('totalCoins')}")
            return False
        
        # Check no _id
        no_id, id_msg = check_no_mongo_id(data)
        if not no_id:
            print_test("Leaderboard - no _id leak", False, id_msg)
            return False
        
        print_test("Leaderboard", True, f"User found with correct totalCoins: {user_entry['totalCoins']}")
        return True
        
    except Exception as e:
        print_test("Leaderboard", False, f"Exception: {str(e)}")
        return False

def test_validation_missing_name():
    """Test 7: POST /api/profile with missing name (should return 400)"""
    print("=" * 60)
    print("TEST 7: Validation - Missing Name")
    print("=" * 60)
    
    try:
        payload = {
            "grade": 4,
            "avatar": "🦊"
        }
        
        response = requests.post(f"{BASE_URL}/profile", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 400:
            print_test("Validation - missing name", False, f"Expected 400, got {response.status_code}")
            return False
        
        print_test("Validation - missing name", True, "Correctly returned 400")
        return True
        
    except Exception as e:
        print_test("Validation - missing name", False, f"Exception: {str(e)}")
        return False

def test_validation_nonexistent_user():
    """Test 8: GET /api/profile/:id with non-existent UUID (should return 404)"""
    print("=" * 60)
    print("TEST 8: Validation - Non-existent User")
    print("=" * 60)
    
    try:
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = requests.get(f"{BASE_URL}/profile/{fake_id}", timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 404:
            print_test("Validation - non-existent user", False, f"Expected 404, got {response.status_code}")
            return False
        
        print_test("Validation - non-existent user", True, "Correctly returned 404")
        return True
        
    except Exception as e:
        print_test("Validation - non-existent user", False, f"Exception: {str(e)}")
        return False

def test_validation_missing_fields_complete_level():
    """Test 9: POST /api/complete-level with missing fields (should return 400)"""
    print("=" * 60)
    print("TEST 9: Validation - Missing Fields in Complete Level")
    print("=" * 60)
    
    try:
        payload = {
            "userId": "some-id",
            "worldId": "mult"
            # missing levelNumber
        }
        
        response = requests.post(f"{BASE_URL}/complete-level", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 400:
            print_test("Validation - missing levelNumber", False, f"Expected 400, got {response.status_code}")
            return False
        
        print_test("Validation - missing levelNumber", True, "Correctly returned 400")
        return True
        
    except Exception as e:
        print_test("Validation - missing levelNumber", False, f"Exception: {str(e)}")
        return False

def test_validation_complete_level_nonexistent_user():
    """Test 10: POST /api/complete-level with non-existent userId (should return 404)"""
    print("=" * 60)
    print("TEST 10: Validation - Complete Level with Non-existent User")
    print("=" * 60)
    
    try:
        payload = {
            "userId": "00000000-0000-0000-0000-000000000000",
            "worldId": "mult",
            "levelNumber": 1,
            "score": 6,
            "total": 6,
            "coinsEarned": 30,
            "stars": 3
        }
        
        response = requests.post(f"{BASE_URL}/complete-level", json=payload, timeout=10)
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        
        if response.status_code != 404:
            print_test("Validation - complete level non-existent user", False, f"Expected 404, got {response.status_code}")
            return False
        
        print_test("Validation - complete level non-existent user", True, "Correctly returned 404")
        return True
        
    except Exception as e:
        print_test("Validation - complete level non-existent user", False, f"Exception: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("LEARNWITHALI BACKEND API TESTS")
    print("=" * 60 + "\n")
    
    results = []
    
    # Happy path tests
    user_id = test_create_profile()
    results.append(("Create Profile", user_id is not None))
    
    if user_id:
        results.append(("Get Profile", test_get_profile(user_id)))
        results.append(("Complete Level 1 First Time", test_complete_level_first(user_id)))
        results.append(("Replay Level 1 Lower Score", test_complete_level_replay(user_id)))
        results.append(("Complete Level 2", test_complete_level_2(user_id)))
        results.append(("Leaderboard", test_leaderboard(user_id)))
    else:
        print("⚠️  Skipping remaining happy path tests due to profile creation failure\n")
        results.extend([
            ("Get Profile", False),
            ("Complete Level 1 First Time", False),
            ("Replay Level 1 Lower Score", False),
            ("Complete Level 2", False),
            ("Leaderboard", False)
        ])
    
    # Validation tests
    results.append(("Validation - Missing Name", test_validation_missing_name()))
    results.append(("Validation - Non-existent User", test_validation_nonexistent_user()))
    results.append(("Validation - Missing Fields", test_validation_missing_fields_complete_level()))
    results.append(("Validation - Non-existent User in Complete Level", test_validation_complete_level_nonexistent_user()))
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n=== All tests passed! ===")
        sys.exit(0)
    else:
        print(f"\n=== {total - passed} test(s) failed ===")
        sys.exit(1)

if __name__ == "__main__":
    main()
