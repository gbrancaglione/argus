require "test_helper"

class Api::SessionsControllerTest < ActionDispatch::IntegrationTest
  test "sign in with valid credentials returns user and sets cookie" do
    post api_session_path, params: { email: "admin@argus.com", password: "password123" }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "admin@argus.com", body.dig("user", "email")
    assert body["token"].present?
    assert response.cookies["jwt"].present?
  end

  test "sign in with invalid password returns unauthorized" do
    post api_session_path, params: { email: "admin@argus.com", password: "wrong" }, as: :json

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "Invalid email or password", body["error"]
  end

  test "sign in with non-existent email returns unauthorized" do
    post api_session_path, params: { email: "nobody@argus.com", password: "password123" }, as: :json

    assert_response :unauthorized
  end

  test "sign out clears the cookie" do
    post api_session_path, params: { email: "admin@argus.com", password: "password123" }, as: :json
    assert_response :success

    delete api_session_path, as: :json
    assert_response :no_content
  end
end
