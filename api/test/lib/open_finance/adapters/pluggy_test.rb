require "test_helper"

class OpenFinance::Adapters::PluggyTest < ActiveSupport::TestCase
  PLUGGY_API = "https://api.pluggy.ai"

  setup do
    @adapter = OpenFinance::Adapters::Pluggy.new
    ENV["PLUGGY_CLIENT_ID"] = "test-client-id"
    ENV["PLUGGY_CLIENT_SECRET"] = "test-client-secret"
    ENV["PLUGGY_ITEM_ID"] = "test-item-id"

    @api_key = JWT.encode({ data: "test", exp: 1.hour.from_now.to_i }, nil, "none")
    stub_auth
    stub_accounts
  end

  test "authenticate! fetches and caches api key" do
    @adapter.accounts

    assert_requested :post, "#{PLUGGY_API}/auth", times: 1
  end

  test "api_key reuses cached key when not expired" do
    @adapter.accounts
    @adapter.accounts

    assert_requested :post, "#{PLUGGY_API}/auth", times: 1
  end

  test "accounts fetches from correct endpoint with item_id" do
    result = @adapter.accounts
    assert_equal "acc-1", result["results"][0]["id"]

    assert_requested :get, "#{PLUGGY_API}/accounts?itemId=test-item-id"
  end

  test "accounts uses provided item_id over env var" do
    stub_request(:get, "#{PLUGGY_API}/accounts?itemId=custom-item")
      .to_return(status: 200, body: { results: [] }.to_json, headers: { "Content-Type" => "application/json" })

    @adapter.accounts("custom-item")

    assert_requested :get, "#{PLUGGY_API}/accounts?itemId=custom-item"
  end

  test "transactions passes all parameters" do
    stub_transactions

    result = @adapter.transactions(
      account_id: "acc-1",
      from: "2026-01-01",
      to: "2026-01-31",
      page: 2,
      page_size: 100
    )

    assert_equal 1, result["results"].length
    assert_requested :get, "#{PLUGGY_API}/transactions?accountId=acc-1&from=2026-01-01&to=2026-01-31&page=2&pageSize=100"
  end

  test "raises OpenFinance::Error on non-success response" do
    stub_request(:get, /#{PLUGGY_API}\/accounts/)
      .to_return(status: 400, body: { message: "Bad Request" }.to_json, headers: { "Content-Type" => "application/json" })

    error = assert_raises(OpenFinance::Error) { @adapter.accounts }
    assert_equal "Bad Request", error.message
    assert_equal 400, error.status
  end

  test "raises OpenFinance::Error on authentication failure" do
    stub_request(:post, "#{PLUGGY_API}/auth")
      .to_return(status: 401, body: { message: "Invalid credentials" }.to_json, headers: { "Content-Type" => "application/json" })

    adapter = OpenFinance::Adapters::Pluggy.new
    error = assert_raises(OpenFinance::Error) { adapter.accounts }
    assert_match(/authentication failed/i, error.message)
  end

  private

  def stub_auth
    stub_request(:post, "#{PLUGGY_API}/auth")
      .with(body: { clientId: "test-client-id", clientSecret: "test-client-secret" }.to_json)
      .to_return(status: 200, body: { apiKey: @api_key }.to_json, headers: { "Content-Type" => "application/json" })
  end

  def stub_accounts
    stub_request(:get, /#{PLUGGY_API}\/accounts/)
      .to_return(
        status: 200,
        body: { results: [{ id: "acc-1", name: "Checking", type: "BANK", balance: 1000.0, currencyCode: "BRL" }] }.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end

  def stub_transactions
    stub_request(:get, /#{PLUGGY_API}\/transactions/)
      .to_return(
        status: 200,
        body: {
          page: 2, total: 1, totalPages: 2,
          results: [{ id: "tx-1", accountId: "acc-1", date: "2026-01-15T12:00:00Z", amount: 50.0, description: "Test", type: "DEBIT" }]
        }.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end
end
