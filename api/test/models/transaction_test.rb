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
end
