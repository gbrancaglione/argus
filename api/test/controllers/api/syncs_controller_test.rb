require "test_helper"

class Api::SyncsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @token = JsonWebToken.encode(user_id: users(:admin).id)
    @auth_headers = { "Authorization" => "Bearer #{@token}" }
  end

  teardown do
    OpenFinance.reset!
  end

  test "returns unauthorized without authentication" do
    post api_syncs_path, params: { from: "2026-03-01", to: "2026-03-31" }, as: :json
    assert_response :unauthorized
  end

  test "creates sync and returns log" do
    OpenFinance.client = mock_client

    post api_syncs_path,
      params: { from: "2026-03-01", to: "2026-03-31" },
      headers: @auth_headers,
      as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "completed", body["status"]
    assert_equal 1, body["accounts_synced"]
    assert_equal 1, body["transactions_created"]
  end

  test "filters by account_types when provided" do
    OpenFinance.client = mock_multi_type_client

    post api_syncs_path,
      params: { from: "2026-03-01", to: "2026-03-31", account_types: ["CREDIT"] },
      headers: @auth_headers,
      as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal 1, body["accounts_synced"]
  end

  test "returns 502 on OpenFinance error" do
    client = Object.new
    client.define_singleton_method(:accounts) { |*| raise OpenFinance::Error.new("API down") }
    OpenFinance.client = client

    post api_syncs_path,
      params: { from: "2026-03-01", to: "2026-03-31" },
      headers: @auth_headers,
      as: :json

    assert_response :bad_gateway
  end

  test "sync creates with pending approval status" do
    OpenFinance.client = mock_client

    post api_syncs_path,
      params: { from: "2026-03-01", to: "2026-03-31" },
      headers: @auth_headers,
      as: :json

    assert_response :created
    body = JSON.parse(response.body)
    assert_equal "pending", body["approval_status"]
  end

  test "approve changes approval_status to approved" do
    sync = sync_logs(:pending_sync)

    patch approve_api_sync_path(sync), headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "approved", body["approval_status"]
    assert_not_nil body["approved_at"]
  end

  test "approve returns 422 for already approved sync" do
    sync = sync_logs(:review_sync)

    patch approve_api_sync_path(sync), headers: @auth_headers, as: :json

    assert_response :unprocessable_entity
  end

  test "approve returns 404 for other user sync" do
    sync = sync_logs(:other_user_sync)

    patch approve_api_sync_path(sync), headers: @auth_headers, as: :json

    assert_response :not_found
  end

  test "reject hard-deletes transactions and sets rejected" do
    sync = sync_logs(:pending_sync)
    tx_id = transactions(:pending_expense).id

    patch reject_api_sync_path(sync), headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "rejected", body["approval_status"]
    assert_not Transaction.with_deleted.exists?(tx_id)
  end

  test "reject returns 422 for non-pending sync" do
    sync = sync_logs(:review_sync)

    patch reject_api_sync_path(sync), headers: @auth_headers, as: :json

    assert_response :unprocessable_entity
  end

  test "lists recent sync logs" do
    get api_syncs_path, headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_kind_of Array, body
    assert body.any? { |l| l["status"] == "completed" }
  end

  private

  def mock_client
    client = Object.new
    client.define_singleton_method(:accounts) do |*|
      {
        "results" => [
          { "id" => "acc-sync-test", "itemId" => "item-1", "name" => "CC", "type" => "CREDIT",
            "subtype" => "CREDIT_CARD", "currencyCode" => "BRL", "balance" => 500.0 }
        ]
      }
    end
    client.define_singleton_method(:transactions) do |**|
      {
        "results" => [
          { "id" => "tx-sync-test-#{SecureRandom.hex(4)}", "accountId" => "acc-sync-test",
            "date" => "2026-03-15T12:00:00Z", "amount" => 100.0, "description" => "Test",
            "category" => "Shopping", "type" => "DEBIT", "status" => "POSTED", "currencyCode" => "BRL" }
        ],
        "totalPages" => 1
      }
    end
    client
  end

  def mock_multi_type_client
    client = Object.new
    client.define_singleton_method(:accounts) do |*|
      {
        "results" => [
          { "id" => "acc-credit-sync", "itemId" => "item-1", "name" => "CC", "type" => "CREDIT",
            "subtype" => "CREDIT_CARD", "currencyCode" => "BRL", "balance" => 500.0 },
          { "id" => "acc-bank-sync", "itemId" => "item-1", "name" => "Checking", "type" => "BANK",
            "subtype" => "CHECKING_ACCOUNT", "currencyCode" => "BRL", "balance" => 5000.0 }
        ]
      }
    end
    client.define_singleton_method(:transactions) do |**|
      { "results" => [], "totalPages" => 1 }
    end
    client
  end
end
