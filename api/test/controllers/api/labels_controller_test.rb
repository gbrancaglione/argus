require "test_helper"

class Api::LabelsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @token = JsonWebToken.encode(user_id: users(:admin).id)
    @auth_headers = { "Authorization" => "Bearer #{@token}" }
  end

  test "returns unauthorized without authentication" do
    get api_labels_path, as: :json
    assert_response :unauthorized
  end

  test "index returns current user labels sorted by name" do
    get api_labels_path, headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    names = body.map { |l| l["name"] }
    assert_includes names, "Groceries"
    assert_includes names, "Shopping"
    assert_not_includes names, "Transportation" # belongs to other user
    assert_equal names, names.sort
  end

  test "create adds a new label" do
    assert_difference -> { users(:admin).labels.count }, 1 do
      post api_labels_path,
        params: { name: "Entretenimento" },
        headers: @auth_headers,
        as: :json
    end

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "Entretenimento", body["name"]
    assert body["id"].is_a?(Integer)
  end

  test "create rejects duplicate name" do
    post api_labels_path,
      params: { name: "Groceries" },
      headers: @auth_headers,
      as: :json

    assert_response :unprocessable_entity
  end

  test "create requires name" do
    post api_labels_path,
      params: {},
      headers: @auth_headers,
      as: :json

    assert_response :bad_request
  end

  test "labels are scoped to user" do
    other_token = JsonWebToken.encode(user_id: users(:other).id)
    get api_labels_path, headers: { "Authorization" => "Bearer #{other_token}" }, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    names = body.map { |l| l["name"] }
    assert_includes names, "Transportation"
    assert_not_includes names, "Groceries"
  end
end
