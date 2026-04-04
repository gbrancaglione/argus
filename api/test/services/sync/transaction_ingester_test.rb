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

  test "creates label matching original_category on create" do
    OpenFinance.client = mock_client([
      pluggy_tx("tx-cat", category: "Shopping")
    ])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-cat")
    assert_equal "Shopping", tx.original_category
    assert_equal "Shopping", tx.label.name
    assert_not tx.category_edited
  end

  test "skips unchanged transactions" do
    raw = pluggy_tx("tx-existing")
    shopping_label = @account.user.labels.find_or_create_by!(name: "Shopping")
    Transaction.create!(
      account: @account,
      external_id: "tx-existing",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Test",
      original_category: "Shopping",
      label: shopping_label,
      category_edited: false,
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
    shopping_label = @account.user.labels.find_or_create_by!(name: "Shopping")
    Transaction.create!(
      account: @account,
      external_id: "tx-changed",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Old description",
      original_category: "Shopping",
      label: shopping_label,
      category_edited: false,
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

  test "preserves user-edited label on update" do
    custom_label = @account.user.labels.find_or_create_by!(name: "Compras pessoais")
    Transaction.create!(
      account: @account,
      external_id: "tx-edited",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Store",
      original_category: "Shopping",
      label: custom_label,
      category_edited: true,
      transaction_type: "DEBIT",
      status: "POSTED",
      raw_data: pluggy_tx("tx-edited", description: "Store")
    )

    OpenFinance.client = mock_client([
      pluggy_tx("tx-edited", description: "Updated Store", category: "Online shopping")
    ])

    stats = Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-edited")
    assert_equal "Compras pessoais", tx.label.name
    assert_equal "Online shopping", tx.original_category
    assert_equal 1, stats[:updated]
  end

  test "updates label when user has not edited it" do
    shopping_label = @account.user.labels.find_or_create_by!(name: "Shopping")
    Transaction.create!(
      account: @account,
      external_id: "tx-unedited",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Store",
      original_category: "Shopping",
      label: shopping_label,
      category_edited: false,
      transaction_type: "DEBIT",
      status: "POSTED",
      raw_data: pluggy_tx("tx-unedited", description: "Store")
    )

    OpenFinance.client = mock_client([
      pluggy_tx("tx-unedited", description: "Store v2", category: "Online shopping")
    ])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-unedited")
    assert_equal "Online shopping", tx.label.name
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
    shopping_label = @account.user.labels.find_or_create_by!(name: "Shopping")
    tx = Transaction.create!(
      account: @account,
      external_id: "tx-deleted",
      date: "2026-03-15",
      amount: 100.0,
      amount_brl: 100.0,
      currency_code: "BRL",
      description: "Deleted",
      original_category: "Shopping",
      label: shopping_label,
      category_edited: false,
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

  test "extracts installment fields from creditCardMetadata" do
    tx_data = pluggy_tx("tx-inst", amount: 200.0, description: "GOL LINHAS")
    tx_data["creditCardMetadata"] = {
      "installmentNumber" => 2,
      "totalInstallments" => 6,
      "purchaseDate" => "2026-01-15T00:00:00.000Z",
      "cardNumber" => "8660",
      "payeeMCC" => 3247
    }

    OpenFinance.client = mock_client([tx_data])
    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-inst")
    assert_equal 2, tx.installment_number
    assert_equal 6, tx.total_installments
    assert_equal Date.new(2026, 1, 15), tx.purchase_date
    assert tx.purchase_key.present?
  end

  test "projects future installments on create" do
    tx_data = pluggy_tx("tx-proj", amount: 83.25, description: "AGILECODE")
    tx_data["creditCardMetadata"] = {
      "installmentNumber" => 3,
      "totalInstallments" => 5,
      "purchaseDate" => "2026-01-16T00:00:00.000Z",
      "cardNumber" => "8660"
    }

    OpenFinance.client = mock_client([tx_data])
    stats = Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    assert_equal 1, stats[:created]
    tx = Transaction.find_by(external_id: "tx-proj")
    projected = Transaction.where(purchase_key: tx.purchase_key, status: "PROJECTED")
                           .order(:installment_number)

    assert_equal 2, projected.count
    assert_equal [4, 5], projected.map(&:installment_number)
    assert projected.all? { |p| p.amount == 83.25.to_d }
    assert projected.all? { |p| p.description == "AGILECODE" }
  end

  test "promotes projected transaction when real one arrives" do
    purchase_date = Date.new(2026, 1, 16)
    key = Transaction.generate_purchase_key(
      account_id: @account.id, purchase_date: purchase_date, amount: 83.25
    )

    projected = Transaction.create!(
      account: @account,
      external_id: "projected:#{key}:4",
      date: Date.new(2026, 4, 15),
      amount: 83.25,
      amount_brl: 83.25,
      transaction_type: "DEBIT",
      status: "PROJECTED",
      description: "AGILECODE",
      installment_number: 4,
      total_installments: 5,
      purchase_date: purchase_date,
      purchase_key: key,
      raw_data: {}
    )

    real_data = pluggy_tx("tx-real-4", amount: 83.25, description: "PG *AGILECODE BRANASIO",
                          date: "2026-04-25T12:00:00Z")
    real_data["creditCardMetadata"] = {
      "installmentNumber" => 4,
      "totalInstallments" => 5,
      "purchaseDate" => "2026-01-16T00:00:00.000Z",
      "cardNumber" => "8660"
    }

    OpenFinance.client = mock_client([real_data])
    stats = Sync::TransactionIngester.new(@account, from: "2026-04-01", to: "2026-04-30").call

    assert_equal 0, stats[:created]
    assert_equal 1, stats[:updated]

    projected.reload
    assert_equal "tx-real-4", projected.external_id
    assert_equal "POSTED", projected.status
    assert_equal "PG *AGILECODE BRANASIO", projected.description
    assert_equal Date.new(2026, 4, 25), projected.date
  end

  test "sets sync_log and sync_action created on new transactions" do
    sync_log = @account.user.sync_logs.create!(
      status: "running", from_date: "2026-03-01", to_date: "2026-03-31", started_at: Time.current
    )
    OpenFinance.client = mock_client([
      pluggy_tx("tx-sl-1", description: "Coffee")
    ])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31", sync_log: sync_log).call

    tx = Transaction.find_by(external_id: "tx-sl-1")
    assert_equal sync_log.id, tx.sync_log_id
    assert_equal "created", tx.sync_action
  end

  test "sets sync_log and sync_action updated on changed transactions" do
    sync_log = @account.user.sync_logs.create!(
      status: "running", from_date: "2026-03-01", to_date: "2026-03-31", started_at: Time.current
    )
    shopping_label = @account.user.labels.find_or_create_by!(name: "Shopping")
    Transaction.create!(
      account: @account, external_id: "tx-sl-upd", date: "2026-03-15",
      amount: 100.0, amount_brl: 100.0, currency_code: "BRL",
      description: "Old", original_category: "Shopping", label: shopping_label,
      category_edited: false, transaction_type: "DEBIT", status: "POSTED",
      raw_data: pluggy_tx("tx-sl-upd", description: "Old")
    )

    OpenFinance.client = mock_client([pluggy_tx("tx-sl-upd", description: "New")])
    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31", sync_log: sync_log).call

    tx = Transaction.find_by(external_id: "tx-sl-upd")
    assert_equal sync_log.id, tx.sync_log_id
    assert_equal "updated", tx.sync_action
  end

  test "does not set sync_log on skipped transactions" do
    sync_log = @account.user.sync_logs.create!(
      status: "running", from_date: "2026-03-01", to_date: "2026-03-31", started_at: Time.current
    )
    raw = pluggy_tx("tx-sl-skip")
    shopping_label = @account.user.labels.find_or_create_by!(name: "Shopping")
    Transaction.create!(
      account: @account, external_id: "tx-sl-skip", date: "2026-03-15",
      amount: 100.0, amount_brl: 100.0, currency_code: "BRL",
      description: "Test", original_category: "Shopping", label: shopping_label,
      category_edited: false, transaction_type: "DEBIT", status: "POSTED",
      raw_data: raw
    )

    OpenFinance.client = mock_client([raw])
    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31", sync_log: sync_log).call

    tx = Transaction.find_by(external_id: "tx-sl-skip")
    assert_nil tx.sync_log_id
    assert_nil tx.sync_action
  end

  test "sets sync_action updated when promoting projected transaction" do
    sync_log = @account.user.sync_logs.create!(
      status: "running", from_date: "2026-04-01", to_date: "2026-04-30", started_at: Time.current
    )
    purchase_date = Date.new(2026, 1, 16)
    key = Transaction.generate_purchase_key(
      account_id: @account.id, purchase_date: purchase_date, amount: 83.25
    )

    Transaction.create!(
      account: @account, external_id: "projected:#{key}:4",
      date: Date.new(2026, 4, 15), amount: 83.25, amount_brl: 83.25,
      transaction_type: "DEBIT", status: "PROJECTED", description: "AGILECODE",
      installment_number: 4, total_installments: 5, purchase_date: purchase_date,
      purchase_key: key, raw_data: {}
    )

    real_data = pluggy_tx("tx-promo-4", amount: 83.25, description: "PG *AGILECODE",
                          date: "2026-04-25T12:00:00Z")
    real_data["creditCardMetadata"] = {
      "installmentNumber" => 4, "totalInstallments" => 5,
      "purchaseDate" => "2026-01-16T00:00:00.000Z"
    }

    OpenFinance.client = mock_client([real_data])
    Sync::TransactionIngester.new(@account, from: "2026-04-01", to: "2026-04-30", sync_log: sync_log).call

    tx = Transaction.find_by(external_id: "tx-promo-4")
    assert_equal sync_log.id, tx.sync_log_id
    assert_equal "updated", tx.sync_action
  end

  test "does not create transaction without installment data" do
    OpenFinance.client = mock_client([
      pluggy_tx("tx-no-inst", amount: 50.0, description: "Coffee")
    ])

    Sync::TransactionIngester.new(@account, from: "2026-03-01", to: "2026-03-31").call

    tx = Transaction.find_by(external_id: "tx-no-inst")
    assert_nil tx.installment_number
    assert_nil tx.total_installments
    assert_nil tx.purchase_key
    assert_equal 0, Transaction.projected.count
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
