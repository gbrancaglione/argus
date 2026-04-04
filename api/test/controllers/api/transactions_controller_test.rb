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

  # — PATCH update tests (local DB) —

  test "update changes transaction label" do
    new_label = users(:admin).labels.create!(name: "Mercado")
    tx = transactions(:grocery_expense)
    patch api_transaction_path(tx),
      params: { label_id: new_label.id },
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "Mercado", body["category"]
    assert_equal new_label.id, body["label_id"]
    assert_equal true, body["category_edited"]
    assert_equal "Groceries", body["original_category"]
    assert_equal new_label.id, tx.reload.label_id
  end

  test "update changes transaction description" do
    tx = transactions(:grocery_expense)
    patch api_transaction_path(tx),
      params: { description: "Supermercado Pão de Açúcar" },
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "Supermercado Pão de Açúcar", body["description"]
    assert_equal "Supermercado Pão de Açúcar", tx.reload.description
  end

  test "update clears label when label_id is nil" do
    tx = transactions(:grocery_expense)
    assert_not_nil tx.label_id

    patch api_transaction_path(tx),
      params: { label_id: nil },
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_nil body["label_id"]
    assert_nil body["category"]
    assert_equal true, body["category_edited"]
    assert_nil tx.reload.label_id
  end

  test "update clears description when empty string" do
    tx = transactions(:grocery_expense)
    tx.update!(description: "Something")

    patch api_transaction_path(tx),
      params: { description: "" },
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "", body["description"]
    assert_equal "", tx.reload.description
  end

  test "update changes both label and description" do
    new_label = users(:admin).labels.create!(name: "Mercado")
    tx = transactions(:grocery_expense)
    patch api_transaction_path(tx),
      params: { label_id: new_label.id, description: "Pão de Açúcar" },
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "Mercado", body["category"]
    assert_equal "Pão de Açúcar", body["description"]
  end

  test "update returns 404 for other user transaction" do
    tx = transactions(:other_user_tx)
    new_label = users(:admin).labels.create!(name: "New")
    patch api_transaction_path(tx),
      params: { label_id: new_label.id },
      headers: @auth_headers,
      as: :json

    assert_response :not_found
  end

  test "update with no params returns current state" do
    tx = transactions(:grocery_expense)
    patch api_transaction_path(tx),
      params: {},
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal tx.label.name, body["category"]
  end

  # — PATCH bulk_update tests —

  test "bulk_update changes label on multiple transactions" do
    new_label = users(:admin).labels.create!(name: "Mercado")
    tx1 = transactions(:grocery_expense)
    tx2 = transactions(:restaurant_expense)

    patch bulk_update_api_transactions_path,
      params: { ids: [tx1.id, tx2.id], label_id: new_label.id },
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal 2, body.length
    assert body.all? { |tx| tx["category"] == "Mercado" }
    assert body.all? { |tx| tx["category_edited"] == true }
    assert_equal new_label.id, tx1.reload.label_id
    assert_equal new_label.id, tx2.reload.label_id
  end

  test "bulk_update clears label when label_id is nil" do
    tx1 = transactions(:grocery_expense)
    tx2 = transactions(:foreign_expense)

    patch bulk_update_api_transactions_path,
      params: { ids: [tx1.id, tx2.id], label_id: nil },
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    assert body.all? { |tx| tx["label_id"].nil? }
    assert body.all? { |tx| tx["category_edited"] == true }
  end

  test "bulk_update returns 404 for label belonging to other user" do
    other_label = users(:other).labels.create!(name: "Other label")
    tx = transactions(:grocery_expense)

    patch bulk_update_api_transactions_path,
      params: { ids: [tx.id], label_id: other_label.id },
      headers: @auth_headers,
      as: :json

    assert_response :not_found
  end

  test "bulk_update returns 400 when no IDs provided" do
    new_label = users(:admin).labels.create!(name: "Test")

    patch bulk_update_api_transactions_path,
      params: { ids: [], label_id: new_label.id },
      headers: @auth_headers,
      as: :json

    assert_response :bad_request
  end

  test "bulk_update returns 400 when no updates provided" do
    tx = transactions(:grocery_expense)

    patch bulk_update_api_transactions_path,
      params: { ids: [tx.id] },
      headers: @auth_headers,
      as: :json

    assert_response :bad_request
  end

  test "bulk_update does not modify other user transactions" do
    new_label = users(:admin).labels.create!(name: "Mercado")
    other_tx = transactions(:other_user_tx)
    own_tx = transactions(:grocery_expense)

    patch bulk_update_api_transactions_path,
      params: { ids: [own_tx.id, other_tx.id], label_id: new_label.id },
      headers: @auth_headers,
      as: :json

    assert_response :success
    body = JSON.parse(response.body)
    # Only own transaction should be updated
    assert_equal 1, body.length
    assert_equal new_label.id, own_tx.reload.label_id
    assert_not_equal new_label.id, other_tx.reload.label_id
  end

  # — DELETE soft-delete tests —

  test "destroy soft-deletes a transaction" do
    tx = transactions(:grocery_expense)
    delete api_transaction_path(tx), headers: @auth_headers, as: :json

    assert_response :no_content
    assert Transaction.with_deleted.find(tx.id).deleted?
    assert_not Transaction.exists?(tx.id)
  end

  test "destroy returns 404 for other user transaction" do
    tx = transactions(:other_user_tx)
    delete api_transaction_path(tx), headers: @auth_headers, as: :json

    assert_response :not_found
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
