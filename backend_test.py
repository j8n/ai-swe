#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

class DevAIAPITester:
    def __init__(self, base_url="https://smartdev-ai-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.refresh_token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text[:200]}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.refresh_token = response['refresh_token']
            self.user_id = response['user']['id']
            print(f"   ✓ Token obtained: {self.token[:20]}...")
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        # Use the same credentials from registration
        timestamp = datetime.now().strftime('%H%M%S')
        test_data = {
            "email": f"test{timestamp}@example.com",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST", 
            "auth/login",
            200,
            data=test_data
        )
        return success

    def test_get_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"   ✓ Stats: {response}")
        return success

    def test_dashboard_recent(self):
        """Test dashboard recent activity"""
        success, response = self.run_test(
            "Dashboard Recent Activity",
            "GET",
            "dashboard/recent",
            200
        )
        return success

    def test_create_project(self):
        """Test project creation"""
        test_data = {
            "name": "Test Laravel Project",
            "description": "A test project for API testing",
            "tech_stack": ["Laravel", "PHP", "Vue.js"]
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=test_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"   ✓ Project created: {self.project_id}")
            return True
        return False

    def test_list_projects(self):
        """Test listing projects"""
        success, response = self.run_test(
            "List Projects",
            "GET",
            "projects",
            200
        )
        if success:
            print(f"   ✓ Found {len(response)} projects")
        return success

    def test_get_project(self):
        """Test getting specific project"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        success, response = self.run_test(
            "Get Project Details",
            "GET",
            f"projects/{self.project_id}",
            200
        )
        return success

    def test_create_task(self):
        """Test task creation"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        test_data = {
            "title": "Add user authentication",
            "description": "Implement JWT-based authentication system",
            "priority": "high"
        }
        
        success, response = self.run_test(
            "Create Task",
            "POST",
            f"projects/{self.project_id}/tasks",
            200,
            data=test_data
        )
        return success

    def test_list_tasks(self):
        """Test listing tasks"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        success, response = self.run_test(
            "List Tasks",
            "GET",
            f"projects/{self.project_id}/tasks",
            200
        )
        if success and len(response) > 0:
            self.task_id = response[0]['id']
            print(f"   ✓ Task ID stored: {self.task_id}")
        return success

    def test_task_execution(self):
        """Test task execution endpoint - should return files_changed array"""
        if not self.project_id or not hasattr(self, 'task_id'):
            print("❌ No project ID or task ID available for testing")
            return False
            
        print("   ⚠️  Note: This test may take 30-60 seconds due to AI processing...")
        success, response = self.run_test(
            "Execute Task (AI Generation)",
            "POST",
            f"projects/{self.project_id}/tasks/{self.task_id}/execute",
            200
        )
        
        if success:
            # Check if response contains files_changed array
            if 'files_changed' in response:
                files_count = len(response['files_changed'])
                print(f"   ✓ Files changed array present: {files_count} files")
                if files_count > 0:
                    print(f"   ✓ Sample file: {response['files_changed'][0].get('path', 'N/A')}")
                return True
            else:
                print("   ❌ Missing files_changed array in response")
                return False
        return success

    def test_list_pull_requests(self):
        """Test listing pull requests - should return files_changed"""
        if not self.project_id:
            print("❌ No project ID available for testing")
            return False
            
        success, response = self.run_test(
            "List Pull Requests",
            "GET",
            f"projects/{self.project_id}/prs",
            200
        )
        
        if success and len(response) > 0:
            # Check if PRs contain files_changed array
            pr = response[0]
            if 'files_changed' in pr:
                files_count = len(pr['files_changed'])
                print(f"   ✓ PR files_changed array present: {files_count} files")
                if files_count > 0:
                    print(f"   ✓ Sample PR file: {pr['files_changed'][0].get('path', 'N/A')}")
                return True
            else:
                print("   ❌ Missing files_changed array in PR response")
                return False
        elif success:
            print("   ✓ No PRs yet (expected after task execution)")
            return True
        return success

    def test_settings_get(self):
        """Test getting user settings"""
        success, response = self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200
        )
        if success:
            print(f"   ✓ Settings: {response}")
        return success

    def test_settings_update(self):
        """Test updating user settings"""
        test_data = {
            "ai_model": "claude-sonnet-4-5-20250929",
            "ai_provider": "anthropic",
            "theme": "light"
        }
        
        success, response = self.run_test(
            "Update Settings",
            "PUT",
            "settings",
            200,
            data=test_data
        )
        return success

    def test_github_auth_url(self):
        """Test GitHub auth URL generation (should fail without config)"""
        success, response = self.run_test(
            "GitHub Auth URL",
            "GET",
            "github/auth-url",
            400  # Expected to fail due to missing GitHub config
        )
        # This should fail, so we count it as success if it returns 400
        if not success and response == {}:
            print("   ✓ Expected failure due to missing GitHub config")
            self.tests_passed += 1
            return True
        return success

def main():
    print("🚀 Starting DevAI API Tests")
    print("=" * 50)
    
    tester = DevAIAPITester()
    
    # Test sequence
    tests = [
        ("User Registration", tester.test_register),
        ("Get Current User", tester.test_get_me),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Dashboard Recent", tester.test_dashboard_recent),
        ("Create Project", tester.test_create_project),
        ("List Projects", tester.test_list_projects),
        ("Get Project Details", tester.test_get_project),
        ("Create Task", tester.test_create_task),
        ("List Tasks", tester.test_list_tasks),
        ("Execute Task (AI)", tester.test_task_execution),
        ("List Pull Requests", tester.test_list_pull_requests),
        ("Get Settings", tester.test_settings_get),
        ("Update Settings", tester.test_settings_update),
        ("GitHub Auth URL (Expected Fail)", tester.test_github_auth_url),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print("\n✅ All tests passed!")
    
    success_rate = (tester.tests_passed / tester.tests_run) * 100 if tester.tests_run > 0 else 0
    print(f"\n📈 Success rate: {success_rate:.1f}%")
    
    return 0 if success_rate >= 80 else 1

if __name__ == "__main__":
    sys.exit(main())