require "test_helper"

class Api::AccountsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @token = JsonWebToken.encode(user_id: users(:admin).id)
    @auth_headers = { "Authorization" => "Bearer #{@token}" }
  end

  teardown do
    OpenFinance.reset!
  end

  test "returns unauthorized without authentication" do
    get api_accounts_path, as: :json

    assert_response :unauthorized
  end

  test "returns accounts list with valid auth" do
    accounts_data = { "results" => [{ "id" => "acc-1", "name" => "Checking", "type" => "BANK", "balance" => 1500.0 }] }
    OpenFinance.client = MockClient.new(accounts: accounts_data)

    get api_accounts_path, headers: @auth_headers, as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "acc-1", body["results"][0]["id"]
  end

  test "returns 502 when Open Finance client fails" do
    OpenFinance.client = MockClient.new(accounts: OpenFinance::Error.new("Service unavailable"))

    get api_accounts_path, headers: @auth_headers, as: :json

    assert_response :bad_gateway
    body = JSON.parse(response.body)
    assert_equal "Service unavailable", body["error"]
  end

  class MockClient < OpenFinance::Client
    def initialize(accounts: nil, transactions: nil)
      @accounts_response = accounts
      @transactions_response = transactions
    end

    def accounts(*)
      raise @accounts_response if @accounts_response.is_a?(Exception)
      @accounts_response
    end

    def transactions(**)
      raise @transactions_response if @transactions_response.is_a?(Exception)
      @transactions_response
    end
  end
end
