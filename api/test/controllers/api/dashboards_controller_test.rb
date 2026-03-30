require "test_helper"

class Api::DashboardsControllerTest < ActionDispatch::IntegrationTest
  test "returns unauthorized without authentication" do
    get api_dashboard_path, as: :json

    assert_response :unauthorized
    body = JSON.parse(response.body)
    assert_equal "Unauthorized", body["error"]
  end

  test "returns dashboard with valid cookie" do
    post api_session_path, params: { email: "admin@argus.com", password: "password123" }, as: :json
    jwt_cookie = response.cookies["jwt"]

    get api_dashboard_path, headers: { "Cookie" => "jwt=#{jwt_cookie}" }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "Welcome to Argus", body["message"]
    assert_equal "admin@argus.com", body.dig("user", "email")
  end

  test "returns dashboard with valid authorization header" do
    token = JsonWebToken.encode(user_id: users(:admin).id)

    get api_dashboard_path, headers: { "Authorization" => "Bearer #{token}" }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "Welcome to Argus", body["message"]
  end

  test "returns unauthorized with expired token" do
    expired_token = JWT.encode({ user_id: users(:admin).id, exp: 1.hour.ago.to_i }, JsonWebToken.secret, "HS256")

    get api_dashboard_path, headers: { "Authorization" => "Bearer #{expired_token}" }, as: :json

    assert_response :unauthorized
  end
end
