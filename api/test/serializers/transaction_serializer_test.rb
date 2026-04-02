require "test_helper"

class TransactionSerializerTest < ActiveSupport::TestCase
  test "as_json returns all transaction attributes" do
    tx = transactions(:grocery_expense)
    result = TransactionSerializer.new(tx).as_json

    assert_equal tx.id, result[:id]
    assert_equal "tx-1", result[:external_id]
    assert_equal Date.parse("2026-03-15"), result[:date]
    assert_equal 150.0, result[:amount]
    assert_equal 150.0, result[:amount_brl]
    assert_equal "BRL", result[:currency_code]
    assert_equal "Supermercado Extra", result[:description]
    assert_equal "Groceries", result[:category]
    assert_equal labels(:groceries).id, result[:label_id]
    assert_equal false, result[:category_edited]
    assert_equal "Groceries", result[:original_category]
    assert_equal "DEBIT", result[:transaction_type]
    assert_equal "POSTED", result[:status]
    assert_equal tx.account_id, result[:account_id]
  end

  test "as_json handles nil amount_brl" do
    tx = transactions(:grocery_expense)
    tx.amount_brl = nil

    result = TransactionSerializer.new(tx).as_json

    assert_nil result[:amount_brl]
  end

  test "many serializes a collection" do
    txs = [transactions(:grocery_expense), transactions(:restaurant_expense)]
    result = TransactionSerializer.many(txs)

    assert_equal 2, result.size
    assert_equal "Supermercado Extra", result[0][:description]
    assert_equal "Restaurante Fasano", result[1][:description]
  end
end
