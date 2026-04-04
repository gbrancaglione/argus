require "test_helper"

class TransactionTest < ActiveSupport::TestCase
  test "valid transaction" do
    assert transactions(:grocery_expense).valid?
  end

  test "requires external_id uniqueness" do
    existing = transactions(:grocery_expense)
    duplicate = Transaction.new(
      account: accounts(:santander_credit),
      external_id: existing.external_id,
      date: Date.current,
      amount: 10,
      transaction_type: "DEBIT"
    )
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:external_id], "has already been taken"
  end

  test "requires date, amount, transaction_type" do
    tx = Transaction.new(account: accounts(:santander_credit), external_id: "new-tx")
    assert_not tx.valid?
    assert_includes tx.errors[:date], "can't be blank"
    assert_includes tx.errors[:amount], "can't be blank"
    assert_includes tx.errors[:transaction_type], "can't be blank"
  end

  test "expenses scope returns positive amounts" do
    expenses = Transaction.expenses
    assert expenses.all? { |t| t.amount > 0 }
  end

  test "credits scope returns negative amounts" do
    credits = Transaction.credits
    assert credits.all? { |t| t.amount < 0 }
    assert_includes credits, transactions(:card_payment)
  end

  test "in_date_range scope" do
    results = Transaction.in_date_range("2026-03-15", "2026-03-16")
    assert_includes results, transactions(:grocery_expense)
    assert_includes results, transactions(:restaurant_expense)
    assert_not_includes results, transactions(:card_payment)
  end

  test "excluding_card_payments scope filters credit card payments" do
    results = accounts(:santander_credit).transactions.excluding_card_payments
    assert_not_includes results, transactions(:card_payment)
    assert_includes results, transactions(:grocery_expense)
    assert_includes results, transactions(:restaurant_expense)
  end

  test "excluding_card_payments includes nil category" do
    tx = transactions(:grocery_expense)
    tx.update!(original_category: nil)
    results = accounts(:santander_credit).transactions.excluding_card_payments
    assert_includes results, tx
  end

  test "expense? returns true for positive amount" do
    assert transactions(:grocery_expense).expense?
    assert_not transactions(:card_payment).expense?
  end

  test "reset_label! restores label to match original_category" do
    tx = transactions(:restaurant_expense)
    assert_equal "Alimentação", tx.label.name
    assert tx.category_edited
    tx.reset_label!
    tx.reload
    assert_equal "Food and drinks", tx.label.name
    assert_not tx.category_edited
  end

  test "reset_label! with nil original_category clears label" do
    tx = transactions(:grocery_expense)
    tx.update!(original_category: nil)
    tx.reset_label!
    tx.reload
    assert_nil tx.label
    assert_not tx.category_edited
  end

  test "category_name returns label name" do
    tx = transactions(:grocery_expense)
    assert_equal "Groceries", tx.category_name
  end

  test "category_name returns nil when no label" do
    tx = transactions(:grocery_expense)
    tx.label = nil
    assert_nil tx.category_name
  end

  test "user delegation through account" do
    tx = transactions(:grocery_expense)
    assert_equal users(:admin), tx.user
  end

  test "soft_delete! sets deleted_at" do
    tx = transactions(:grocery_expense)
    tx.soft_delete!
    assert tx.deleted?
    assert_not_nil tx.deleted_at
  end

  test "default scope excludes soft-deleted" do
    tx = transactions(:grocery_expense)
    tx.soft_delete!
    assert_not_includes Transaction.all, tx
  end

  test "with_deleted scope includes soft-deleted" do
    tx = transactions(:grocery_expense)
    tx.soft_delete!
    assert_includes Transaction.with_deleted.all, tx
  end

  test "installment? returns true when total_installments > 1 and installment_number present" do
    tx = transactions(:grocery_expense)
    tx.total_installments = 6
    tx.installment_number = 1
    assert tx.installment?
  end

  test "installment? returns false when total_installments is nil" do
    assert_not transactions(:grocery_expense).installment?
  end

  test "installment? returns false when installment_number is nil" do
    tx = transactions(:grocery_expense)
    tx.total_installments = 6
    tx.installment_number = nil
    assert_not tx.installment?
  end

  test "projected? returns true when status is PROJECTED" do
    tx = transactions(:grocery_expense)
    tx.status = "PROJECTED"
    assert tx.projected?
  end

  test "projected scope returns only projected transactions" do
    tx = transactions(:grocery_expense)
    tx.update!(status: "PROJECTED")
    assert_includes Transaction.projected, tx
    assert_not_includes Transaction.not_projected, tx
  end

  test "generate_purchase_key is deterministic" do
    key1 = Transaction.generate_purchase_key(account_id: 1, purchase_date: "2026-01-15", amount: 100.0)
    key2 = Transaction.generate_purchase_key(account_id: 1, purchase_date: "2026-01-15", amount: 100.0)
    assert_equal key1, key2
  end

  test "generate_purchase_key differs for different inputs" do
    key1 = Transaction.generate_purchase_key(account_id: 1, purchase_date: "2026-01-15", amount: 100.0)
    key2 = Transaction.generate_purchase_key(account_id: 1, purchase_date: "2026-01-15", amount: 200.0)
    assert_not_equal key1, key2
  end

  test "project_future_installments! creates remaining installments" do
    account = accounts(:santander_credit)
    key = Transaction.generate_purchase_key(account_id: account.id, purchase_date: "2026-01-10", amount: 100.0)

    tx = Transaction.create!(
      account: account,
      external_id: "inst-source",
      date: Date.new(2026, 3, 15),
      amount: 100.0,
      amount_brl: 100.0,
      transaction_type: "DEBIT",
      status: "POSTED",
      installment_number: 3,
      total_installments: 5,
      purchase_date: Date.new(2026, 1, 10),
      purchase_key: key,
      raw_data: {}
    )

    tx.project_future_installments!

    projected = Transaction.where(purchase_key: key, status: "PROJECTED").order(:installment_number)
    assert_equal 2, projected.count
    assert_equal [4, 5], projected.map(&:installment_number)
    assert_equal [Date.new(2026, 4, 15), Date.new(2026, 5, 15)], projected.map(&:date)
    assert projected.all? { |p| p.amount == 100.0 }
  end

  test "project_future_installments! is idempotent" do
    account = accounts(:santander_credit)
    key = Transaction.generate_purchase_key(account_id: account.id, purchase_date: "2026-01-10", amount: 50.0)

    tx = Transaction.create!(
      account: account,
      external_id: "inst-idemp",
      date: Date.new(2026, 3, 15),
      amount: 50.0,
      amount_brl: 50.0,
      transaction_type: "DEBIT",
      status: "POSTED",
      installment_number: 2,
      total_installments: 4,
      purchase_date: Date.new(2026, 1, 10),
      purchase_key: key,
      raw_data: {}
    )

    tx.project_future_installments!
    tx.project_future_installments!

    assert_equal 2, Transaction.where(purchase_key: key, status: "PROJECTED").count
  end

  test "visible scope excludes transactions from pending syncs" do
    visible = users(:admin).transactions.visible
    assert_not_includes visible, transactions(:pending_expense)
    assert_includes visible, transactions(:grocery_expense)
  end

  test "visible scope includes transactions with no sync_log" do
    tx = transactions(:uncategorized_expense)
    assert_nil tx.sync_log_id
    assert_includes Transaction.visible, tx
  end

  test "visible scope includes transactions from approved syncs" do
    tx = transactions(:grocery_expense)
    assert_equal "approved", tx.sync_log.approval_status
    assert_includes Transaction.visible, tx
  end

  test "project_future_installments! skips when already at last installment" do
    account = accounts(:santander_credit)
    key = Transaction.generate_purchase_key(account_id: account.id, purchase_date: "2026-01-10", amount: 75.0)

    tx = Transaction.create!(
      account: account,
      external_id: "inst-last",
      date: Date.new(2026, 3, 15),
      amount: 75.0,
      amount_brl: 75.0,
      transaction_type: "DEBIT",
      status: "POSTED",
      installment_number: 4,
      total_installments: 4,
      purchase_date: Date.new(2026, 1, 10),
      purchase_key: key,
      raw_data: {}
    )

    tx.project_future_installments!
    assert_equal 0, Transaction.where(purchase_key: key, status: "PROJECTED").count
  end
end
