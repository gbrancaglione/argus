require "test_helper"

class AccountTest < ActiveSupport::TestCase
  test "valid account" do
    account = accounts(:santander_credit)
    assert account.valid?
  end

  test "requires external_id" do
    account = Account.new(user: users(:admin), item_id: "item-1", name: "Test", account_type: "CREDIT")
    assert_not account.valid?
    assert_includes account.errors[:external_id], "can't be blank"
  end

  test "external_id unique per user" do
    existing = accounts(:santander_credit)
    duplicate = Account.new(
      user: existing.user,
      external_id: existing.external_id,
      item_id: "item-x",
      name: "Duplicate",
      account_type: "CREDIT"
    )
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:external_id], "has already been taken"
  end

  test "same external_id allowed for different users" do
    account = Account.new(
      user: users(:other),
      external_id: accounts(:santander_credit).external_id,
      item_id: "item-x",
      name: "Same ext id, diff user",
      account_type: "CREDIT"
    )
    assert account.valid?
  end

  test "credit_cards scope" do
    credit_cards = users(:admin).accounts.credit_cards
    assert credit_cards.all? { |a| a.account_type == "CREDIT" }
    assert_includes credit_cards, accounts(:santander_credit)
    assert_not_includes credit_cards, accounts(:santander_checking)
  end

  test "bank_accounts scope" do
    banks = users(:admin).accounts.bank_accounts
    assert banks.all? { |a| a.account_type == "BANK" }
    assert_includes banks, accounts(:santander_checking)
    assert_not_includes banks, accounts(:santander_credit)
  end

  test "credit_card? returns true for CREDIT type" do
    assert accounts(:santander_credit).credit_card?
    assert_not accounts(:santander_checking).credit_card?
  end

  test "destroying account destroys transactions" do
    account = accounts(:santander_credit)
    tx_count = account.transactions.count
    assert tx_count > 0
    assert_difference("Transaction.count", -tx_count) do
      account.destroy!
    end
  end
end
