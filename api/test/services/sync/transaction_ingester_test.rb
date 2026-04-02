require "test_helper"

class Sync::TransactionIngesterTest < ActiveSupport::TestCase
  setup do
    @account = accounts(:santander_credit)
    @account.transactions.destroy_all
  end

  teardown do
    OpenFinance.reset!
  end

  test "creates new transactions" do
    OpenFinance.client = mock_client([
      pluggy_tx("tx-new-1", amount: 100.0, description: "Coffee", category: "Food and drinks"),
      pluggy_tx("tx-new-2", amount: 50.0, description: "Gas", category: "Transportation")
    ])

    stats = Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    assert_equal 2, stats[:created]
    assert_equal 0, stats[:updated]
    assert_equal 0, stats[:skipped]
    assert_equal 2, @account.transactions.count
  end

  test "sets category to original_category on create" do
    OpenFinance.client = mock_client([
      pluggy_tx("tx-cat", category: "Shopping")
    ])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-cat")
    assert_equal "Shopping", tx.original_category
    assert_equal "Shopping", tx.category
  end

  test "skips unchanged transactions" do
    raw = pluggy_tx("tx-existing")
    Transaction.create!(
      account: @account,
      external_id: "tx-existing",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Test",
      original_category: "Shopping",
      category: "Shopping",
      transaction_type: "DEBIT",
      status: "POSTED",
      raw_data: raw
    )

    OpenFinance.client = mock_client([raw])
    stats = Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    assert_equal 0, stats[:created]
    assert_equal 0, stats[:updated]
    assert_equal 1, stats[:skipped]
  end

  test "updates changed transactions" do
    Transaction.create!(
      account: @account,
      external_id: "tx-changed",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Old description",
      original_category: "Shopping",
      category: "Shopping",
      transaction_type: "DEBIT",
      status: "POSTED",
      raw_data: pluggy_tx("tx-changed", description: "Old description")
    )

    OpenFinance.client = mock_client([
      pluggy_tx("tx-changed", description: "New description")
    ])

    stats = Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    assert_equal 0, stats[:created]
    assert_equal 1, stats[:updated]
    tx = Transaction.find_by(external_id: "tx-changed")
    assert_equal "New description", tx.description
  end

  test "preserves user-edited category on update" do
    Transaction.create!(
      account: @account,
      external_id: "tx-edited",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Store",
      original_category: "Shopping",
      category: "Compras pessoais",
      transaction_type: "DEBIT",
      status: "POSTED",
      raw_data: pluggy_tx("tx-edited", description: "Store")
    )

    OpenFinance.client = mock_client([
      pluggy_tx("tx-edited", description: "Updated Store", category: "Online shopping")
    ])

    stats = Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-edited")
    assert_equal "Compras pessoais", tx.category
    assert_equal "Online shopping", tx.original_category
    assert_equal 1, stats[:updated]
  end

  test "updates category when user has not edited it" do
    Transaction.create!(
      account: @account,
      external_id: "tx-unedited",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Store",
      original_category: "Shopping",
      category: "Shopping",
      transaction_type: "DEBIT",
      status: "POSTED",
      raw_data: pluggy_tx("tx-unedited", description: "Store")
    )

    OpenFinance.client = mock_client([
      pluggy_tx("tx-unedited", description: "Store v2", category: "Online shopping")
    ])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-unedited")
    assert_equal "Online shopping", tx.category
    assert_equal "Online shopping", tx.original_category
  end

  test "handles multi-currency transactions without conversion" do
    OpenFinance.client = mock_client([
      pluggy_tx("tx-usd", amount: 50.0, currency_code: "USD")
    ])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-usd")
    assert_equal "USD", tx.currency_code
    assert_equal 50.0, tx.amount.to_f
    assert_nil tx.amount_brl
  end

  test "uses amountInAccountCurrency for BRL conversion" do
    tx_data = pluggy_tx("tx-uyu", amount: 1421.34, currency_code: "UYU")
    tx_data["amountInAccountCurrency"] = 195.75

    OpenFinance.client = mock_client([tx_data])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-uyu")
    assert_equal "UYU", tx.currency_code
    assert_equal 1421.34, tx.amount.to_f
    assert_equal 195.75, tx.amount_brl.to_f
  end

  test "handles pagination" do
    page1 = [pluggy_tx("tx-p1")]
    page2 = [pluggy_tx("tx-p2")]

    call_count = 0
    client = Object.new
    client.define_singleton_method(:accounts) { |*| { "results" => [] } }
    client.define_singleton_method(:transactions) do |**kwargs|
      call_count += 1
      if kwargs[:page] == 1
        { "results" => page1, "totalPages" => 2 }
      else
        { "results" => page2, "totalPages" => 2 }
      end
    end
    OpenFinance.client = client

    stats = Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    assert_equal 2, stats[:created]
    assert_equal 2, call_count
  end

  test "skips soft-deleted transactions" do
    tx = Transaction.create!(
      account: @account,
      external_id: "tx-deleted",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Deleted",
      original_category: "Shopping",
      category: "Shopping",
      transaction_type: "DEBIT",
      status: "POSTED",
      raw_data: pluggy_tx("tx-deleted")
    )
    tx.soft_delete!

    OpenFinance.client = mock_client([
      pluggy_tx("tx-deleted", description: "Updated deleted")
    ])

    stats = Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    assert_equal 0, stats[:created]
    assert_equal 0, stats[:updated]
    assert_equal 1, stats[:skipped]
    # Should still be deleted
    assert Transaction.with_deleted.find_by(external_id: "tx-deleted").deleted?
  end

  test "parses date in Sao Paulo timezone" do
    OpenFinance.client = mock_client([
      pluggy_tx("tx-tz", date: "2026-03-15T23:30:00Z")
    ])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-tz")
    # 23:30 UTC = 20:30 BRT (UTC-3), still March 15
    assert_equal Date.new(2026, 3, 15), tx.date
  end

  private

  def pluggy_tx(id, amount: 100.0, description: "Test", category: "Shopping",
                date: "2026-03-15T12:00:00Z", currency_code: "BRL")
    {
      "id" => id,
      "accountId" => @account.external_id,
      "date" => date,
      "amount" => amount,
      "description" => description,
      "category" => category,
      "type" => "DEBIT",
      "status" => "POSTED",
      "currencyCode" => currency_code
    }
  end

  def mock_client(transactions)
    client = Object.new
    client.define_singleton_method(:accounts) { |*| { "results" => [] } }
    client.define_singleton_method(:transactions) do |**|
      { "results" => transactions, "totalPages" => 1 }
    end
    OpenFinance.client = client
    client
  end
end
