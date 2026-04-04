require "test_helper"

class Api::SyncTransactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @token = JsonWebToken.encode(user_id: users(:admin).id)
    @auth_headers = { "Authorization" => "Bearer #{@token}" }
    @sync_log = sync_logs(:review_sync)
  end

  test "returns unauthorized without authentication" do
    get api_sync_transactions_path(@sync_log), as: :json

    assert_response :unauthorized
  end

  test "returns paginated transactions for a sync" do
    get api_sync_transactions_path(@sync_log), headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 3, body["total"]
    assert_equal 3, body["results"].length
    assert_equal 1, body["page"]
    assert_equal 1, body["total_pages"]
  end

  test "filters by sync_action=created" do
    get "#{api_sync_transactions_path(@sync_log)}?sync_action=created",
      headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["total"]
    assert body["results"].all? { |tx| tx["sync_action"] == "created" }
  end

  test "filters by sync_action=updated" do
    get "#{api_sync_transactions_path(@sync_log)}?sync_action=updated",
      headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["total"]
    assert_equal "updated", body["results"][0]["sync_action"]
  end

  test "paginates results" do
    get "#{api_sync_transactions_path(@sync_log)}?per_page=2",
      headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body["results"].length
    assert_equal 2, body["total_pages"]
    assert_equal 3, body["total"]
  end

  test "returns 404 for other user sync log" do
    other_sync = sync_logs(:other_user_sync)

    get api_sync_transactions_path(other_sync), headers: @auth_headers, as: :json

    assert_response :not_found
  end

  test "returns empty when sync has no linked transactions" do
    empty_sync = sync_logs(:completed_sync)

    get api_sync_transactions_path(empty_sync), headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 0, body["total"]
    assert_equal [], body["results"]
  end

  test "includes transaction details in response" do
    get api_sync_transactions_path(@sync_log), headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    tx = body["results"].find { |t| t["external_id"] == "tx-1" }
    assert_not_nil tx
    assert_equal "Supermercado Extra", tx["description"]
    assert_equal "Groceries", tx["category"]
    assert_equal "created", tx["sync_action"]
  end
end
