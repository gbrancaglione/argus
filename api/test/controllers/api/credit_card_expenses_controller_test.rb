require "test_helper"

class Api::CreditCardExpensesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @token = JsonWebToken.encode(user_id: users(:admin).id)
    @auth_headers = { "Authorization" => "Bearer #{@token}" }
  end

  test "returns unauthorized without authentication" do
    get api_credit_card_expenses_path(from: "2026-03-01", to: "2026-03-31")
    assert_response :unauthorized
  end

  test "returns paginated credit card transactions" do
    get "#{api_credit_card_expenses_path}?from=2026-03-01&to=2026-03-31",
      headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert_kind_of Array, body["results"]
    assert body["page"].is_a?(Integer)
    assert body["total_pages"].is_a?(Integer)
  end

  test "excludes credit card payment transactions" do
    get "#{api_credit_card_expenses_path}?from=2026-03-01&to=2026-03-31",
      headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    descriptions = body["results"].map { |t| t["description"] }
    assert_not_includes descriptions, "Pagamento de fatura"
  end

  test "only includes CREDIT account transactions" do
    get "#{api_credit_card_expenses_path}?from=2026-03-01&to=2026-03-31",
      headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    account_ids = body["results"].map { |t| t["account_id"] }
    credit_account_ids = users(:admin).accounts.credit_cards.pluck(:id)
    account_ids.each do |aid|
      assert_includes credit_account_ids, aid
    end
  end

  test "does not include other user transactions" do
    get "#{api_credit_card_expenses_path}?from=2026-03-01&to=2026-03-31",
      headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    external_ids = body["results"].map { |t| t["external_id"] }
    assert_not_includes external_ids, transactions(:other_user_tx).external_id
  end

  test "returns transaction with category and original_category" do
    get "#{api_credit_card_expenses_path}?from=2026-03-01&to=2026-03-31",
      headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    tx = body["results"].find { |t| t["external_id"] == "tx-2" }
    assert_not_nil tx
    assert_equal "Alimentação", tx["category"]
    assert_equal "Food and drinks", tx["original_category"]
  end

  test "summary returns aggregated data" do
    get "#{summary_api_credit_card_expenses_path}?from=2026-03-01&to=2026-03-31",
      headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert body["total_spent"].is_a?(Numeric)
    assert body["transaction_count"].is_a?(Integer)
    assert_kind_of Hash, body["monthly"]
    assert_kind_of Hash, body["daily"]
    assert_kind_of Array, body["by_category"]
  end

  test "summary excludes card payments from totals" do
    get "#{summary_api_credit_card_expenses_path}?from=2026-03-01&to=2026-03-31",
      headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    # Card payment of -1500 should not be included (it's negative AND excluded by category)
    # Expenses: grocery 150 + restaurant 85.50 + foreign 50 (USD amount) = 285.50
    assert body["total_spent"] > 0
    by_cat = body["by_category"].map { |c| c["category"] }
    assert_not_includes by_cat, "Credit card payment"
  end

  test "summary only counts expenses (positive amounts)" do
    get "#{summary_api_credit_card_expenses_path}?from=2026-03-01&to=2026-03-31",
      headers: @auth_headers

    assert_response :success
    body = JSON.parse(response.body)
    assert body["total_spent"] >= 0
  end

  test "requires from and to params" do
    get api_credit_card_expenses_path, headers: @auth_headers

    assert_response :bad_request
  end
end
