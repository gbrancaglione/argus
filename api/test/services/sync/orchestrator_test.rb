require "test_helper"

class Sync::OrchestratorTest < ActiveSupport::TestCase
  setup do
    @user = users(:admin)
    @user.accounts.destroy_all
  end

  teardown do
    OpenFinance.reset!
  end

  test "syncs accounts and transactions, creates sync log" do
    OpenFinance.client = mock_full_client

    log = Sync::Orchestrator.new(@user, from: "2026-03-01", to: "2026-03-31").call

    assert_equal "completed", log.status
    assert_equal 1, log.accounts_synced
    assert_equal 2, log.transactions_created
    assert_not_nil log.finished_at
    assert_equal Date.new(2026, 3, 1), log.from_date
    assert_equal Date.new(2026, 3, 31), log.to_date
  end

  test "filters by account type when specified" do
    OpenFinance.client = mock_multi_type_client

    log = Sync::Orchestrator.new(
      @user,
      from: "2026-03-01",
      to: "2026-03-31",
      account_types: ["CREDIT"]
    ).call

    assert_equal "completed", log.status
    assert_equal 1, log.accounts_synced
  end

  test "logs failure on error" do
    client = Object.new
    client.define_singleton_method(:accounts) { |*| raise OpenFinance::Error.new("API down") }
    OpenFinance.client = client

    assert_raises(OpenFinance::Error) do
      Sync::Orchestrator.new(@user, from: "2026-03-01", to: "2026-03-31").call
    end

    log = @user.sync_logs.recent.first
    assert_equal "failed", log.status
    assert_equal "API down", log.error_message
    assert_not_nil log.finished_at
  end

  test "links transactions to sync log" do
    OpenFinance.client = mock_full_client

    log = Sync::Orchestrator.new(@user, from: "2026-03-01", to: "2026-03-31").call

    assert_equal 2, log.transactions.count
    assert log.transactions.all? { |tx| tx.sync_action == "created" }
  end

  test "creates sync log with running status initially" do
    OpenFinance.client = mock_full_client
    Sync::Orchestrator.new(@user, from: "2026-03-01", to: "2026-03-31").call

    log = @user.sync_logs.recent.first
    assert_not_nil log.started_at
  end

  private

  def mock_full_client
    client = Object.new
    client.define_singleton_method(:accounts) do |*|
      {
        "results" => [
          { "id" => "acc-sync-1", "itemId" => "item-1", "name" => "CC Test", "type" => "CREDIT",
            "subtype" => "CREDIT_CARD", "currencyCode" => "BRL", "balance" => 500.0 }
        ]
      }
    end
    client.define_singleton_method(:transactions) do |**|
      {
        "results" => [
          { "id" => "tx-sync-1", "accountId" => "acc-sync-1", "date" => "2026-03-15T12:00:00Z",
            "amount" => 100.0, "description" => "Test 1", "category" => "Shopping",
            "type" => "DEBIT", "status" => "POSTED", "currencyCode" => "BRL" },
          { "id" => "tx-sync-2", "accountId" => "acc-sync-1", "date" => "2026-03-16T12:00:00Z",
            "amount" => 200.0, "description" => "Test 2", "category" => "Food and drinks",
            "type" => "DEBIT", "status" => "POSTED", "currencyCode" => "BRL" }
        ],
        "totalPages" => 1
      }
    end
    client
  end

  def mock_multi_type_client
    client = Object.new
    client.define_singleton_method(:accounts) do |*|
      {
        "results" => [
          { "id" => "acc-credit", "itemId" => "item-1", "name" => "CC", "type" => "CREDIT",
            "subtype" => "CREDIT_CARD", "currencyCode" => "BRL", "balance" => 500.0 },
          { "id" => "acc-bank", "itemId" => "item-1", "name" => "Checking", "type" => "BANK",
            "subtype" => "CHECKING_ACCOUNT", "currencyCode" => "BRL", "balance" => 5000.0 }
        ]
      }
    end
    client.define_singleton_method(:transactions) do |**|
      { "results" => [], "totalPages" => 1 }
    end
    client
  end
end
