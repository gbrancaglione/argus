require "test_helper"

class Sync::AccountSyncerTest < ActiveSupport::TestCase
  setup do
    @user = users(:admin)
  end

  teardown do
    OpenFinance.reset!
  end

  test "creates new accounts from Pluggy data" do
    @user.accounts.destroy_all

    OpenFinance.client = mock_client(accounts: {
      "results" => [
        { "id" => "new-acc-1", "itemId" => "item-1", "name" => "Cartão Visa", "type" => "CREDIT",
          "subtype" => "CREDIT_CARD", "currencyCode" => "BRL", "balance" => 1500.0 }
      ]
    })

    result = Sync::AccountSyncer.new(@user).call

    assert_equal 1, result.size
    account = result.first
    assert_equal "new-acc-1", account.external_id
    assert_equal "Cartão Visa", account.name
    assert_equal "CREDIT", account.account_type
    assert_equal "item-1", account.item_id
  end

  test "updates existing accounts" do
    existing = accounts(:santander_credit)
    old_name = existing.name

    OpenFinance.client = mock_client(accounts: {
      "results" => [
        { "id" => existing.external_id, "itemId" => existing.item_id, "name" => "Updated Name",
          "type" => "CREDIT", "subtype" => "CREDIT_CARD", "currencyCode" => "BRL", "balance" => 2000.0 }
      ]
    })

    result = Sync::AccountSyncer.new(@user).call

    assert_equal 1, result.size
    existing.reload
    assert_equal "Updated Name", existing.name
    assert_equal 2000.0, existing.balance.to_f
  end

  test "handles multiple accounts" do
    @user.accounts.destroy_all

    OpenFinance.client = mock_client(accounts: {
      "results" => [
        { "id" => "acc-a", "itemId" => "item-1", "name" => "CC", "type" => "CREDIT",
          "subtype" => "CREDIT_CARD", "currencyCode" => "BRL", "balance" => 100.0 },
        { "id" => "acc-b", "itemId" => "item-1", "name" => "Conta", "type" => "BANK",
          "subtype" => "CHECKING_ACCOUNT", "currencyCode" => "BRL", "balance" => 5000.0 }
      ]
    })

    result = Sync::AccountSyncer.new(@user).call
    assert_equal 2, result.size
    assert_equal %w[CREDIT BANK], result.map(&:account_type)
  end

  private

  def mock_client(accounts:)
    client = Object.new
    client.define_singleton_method(:accounts) { |*| accounts }
    client.define_singleton_method(:transactions) { |**| { "results" => [], "totalPages" => 1 } }
    client
  end
end
