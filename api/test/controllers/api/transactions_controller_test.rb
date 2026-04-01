require "test_helper"

class Api::TransactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @token = JsonWebToken.encode(user_id: users(:admin).id)
    @auth_headers = { "Authorization" => "Bearer #{@token}" }
  end

  teardown do
    OpenFinance.reset!
  end

  test "returns unauthorized without authentication" do
    get api_transactions_path, as: :json

    assert_response :unauthorized
  end

  test "requires account_id parameter" do
    OpenFinance.client = mock_client

    get "#{api_transactions_path}?from=2026-01-01&to=2026-01-31", headers: @auth_headers

    assert_response :bad_request
  end

  test "requires from parameter" do
    OpenFinance.client = mock_client

    get "#{api_transactions_path}?account_id=acc-1&to=2026-01-31", headers: @auth_headers

    assert_response :bad_request
  end

  test "requires to parameter" do
    OpenFinance.client = mock_client

    get "#{api_transactions_path}?account_id=acc-1&from=2026-01-01", headers: @auth_headers

    assert_response :bad_request
  end

  test "returns paginated transactions" do
    transactions_data = {
      "page" => 1, "total" => 1, "totalPages" => 1,
      "results" => [{ "id" => "tx-1", "amount" => 50.0, "description" => "Test", "type" => "DEBIT", "date" => "2026-01-15T12:00:00Z" }]
    }
    OpenFinance.client = mock_client(transactions_data)

    get "#{api_transactions_path}?account_id=acc-1&from=2026-01-01&to=2026-01-31", headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 1, body["results"].length
    assert_equal "tx-1", body["results"][0]["id"]
  end

  test "summary returns monthly and daily aggregations" do
    transactions_data = {
      "page" => 1, "total" => 3, "totalPages" => 1,
      "results" => [
        { "id" => "tx-1", "amount" => 100.0, "type" => "DEBIT", "date" => "2026-01-10T15:00:00Z" },
        { "id" => "tx-2", "amount" => 50.0, "type" => "DEBIT", "date" => "2026-01-10T18:00:00Z" },
        { "id" => "tx-3", "amount" => 200.0, "type" => "DEBIT", "date" => "2026-02-05T12:00:00Z" }
      ]
    }
    OpenFinance.client = mock_client(transactions_data)

    get "#{summary_api_transactions_path}?account_id=acc-1&from=2026-01-01&to=2026-02-28", headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 350.0, body["total_spent"]
    assert_equal 3, body["transaction_count"]
    assert_equal 150.0, body["monthly"]["2026-01"]["spent"]
    assert_equal 200.0, body["monthly"]["2026-02"]["spent"]
    assert_equal 150.0, body["daily"]["2026-01-10"]["spent"]
    assert_equal 200.0, body["daily"]["2026-02-05"]["spent"]
  end

  test "summary excludes negative amounts (payments/credits)" do
    transactions_data = {
      "page" => 1, "total" => 2, "totalPages" => 1,
      "results" => [
        { "id" => "tx-1", "amount" => 100.0, "type" => "DEBIT", "date" => "2026-01-10T12:00:00Z" },
        { "id" => "tx-2", "amount" => -50.0, "type" => "CREDIT", "date" => "2026-01-10T12:00:00Z" }
      ]
    }
    OpenFinance.client = mock_client(transactions_data)

    get "#{summary_api_transactions_path}?account_id=acc-1&from=2026-01-01&to=2026-01-31", headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 100.0, body["total_spent"]
  end

  test "returns 502 when Open Finance client fails" do
    OpenFinance.client = mock_client(OpenFinance::Error.new("API error"))

    get "#{api_transactions_path}?account_id=acc-1&from=2026-01-01&to=2026-01-31", headers: @auth_headers

    assert_response :bad_gateway
  end

  test "summary returns 502 when Open Finance client fails" do
    OpenFinance.client = mock_client(OpenFinance::Error.new("API error"))

    get "#{summary_api_transactions_path}?account_id=acc-1&from=2026-01-01&to=2026-01-31", headers: @auth_headers

    assert_response :bad_gateway
  end

  private

  def mock_client(transactions_response = nil)
    client = Object.new
    client.define_singleton_method(:transactions) do |**|
      raise transactions_response if transactions_response.is_a?(Exception)
      transactions_response || { "page" => 1, "total" => 0, "totalPages" => 0, "results" => [] }
    end
    client
  end
end
