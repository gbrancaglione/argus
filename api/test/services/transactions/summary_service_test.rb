require "test_helper"

class Transactions::SummaryServiceTest < ActiveSupport::TestCase
  teardown do
    OpenFinance.reset!
  end

  test "returns total spent excluding negative amounts" do
    OpenFinance.client = mock_client([
      { "id" => "tx-1", "amount" => 100.0, "date" => "2026-01-10T12:00:00Z" },
      { "id" => "tx-2", "amount" => -50.0, "date" => "2026-01-10T12:00:00Z" }
    ])

    result = Transactions::SummaryService.new(
      account_id: "acc-1", from: "2026-01-01", to: "2026-01-31"
    ).call

    assert_equal 100.0, result[:total_spent]
  end

  test "returns transaction count" do
    OpenFinance.client = mock_client([
      { "id" => "tx-1", "amount" => 100.0, "date" => "2026-01-10T12:00:00Z" },
      { "id" => "tx-2", "amount" => 50.0, "date" => "2026-01-15T12:00:00Z" }
    ])

    result = Transactions::SummaryService.new(
      account_id: "acc-1", from: "2026-01-01", to: "2026-01-31"
    ).call

    assert_equal 2, result[:transaction_count]
  end

  test "returns monthly breakdown" do
    OpenFinance.client = mock_client([
      { "id" => "tx-1", "amount" => 100.0, "date" => "2026-01-10T12:00:00Z" },
      { "id" => "tx-2", "amount" => 200.0, "date" => "2026-02-05T12:00:00Z" }
    ])

    result = Transactions::SummaryService.new(
      account_id: "acc-1", from: "2026-01-01", to: "2026-02-28"
    ).call

    assert_equal 100.0, result[:monthly]["2026-01"][:spent]
    assert_equal 1, result[:monthly]["2026-01"][:count]
    assert_equal 200.0, result[:monthly]["2026-02"][:spent]
    assert_equal 1, result[:monthly]["2026-02"][:count]
  end

  test "returns daily breakdown" do
    OpenFinance.client = mock_client([
      { "id" => "tx-1", "amount" => 100.0, "date" => "2026-01-10T15:00:00Z" },
      { "id" => "tx-2", "amount" => 50.0, "date" => "2026-01-10T18:00:00Z" }
    ])

    result = Transactions::SummaryService.new(
      account_id: "acc-1", from: "2026-01-01", to: "2026-01-31"
    ).call

    assert_equal 150.0, result[:daily]["2026-01-10"][:spent]
    assert_equal 2, result[:daily]["2026-01-10"][:count]
  end

  test "fetches multiple pages" do
    OpenFinance.client = mock_paginated_client

    result = Transactions::SummaryService.new(
      account_id: "acc-1", from: "2026-01-01", to: "2026-01-31"
    ).call

    assert_equal 3, result[:transaction_count]
    assert_equal 300.0, result[:total_spent]
  end

  test "returns empty summary when no transactions" do
    OpenFinance.client = mock_client([])

    result = Transactions::SummaryService.new(
      account_id: "acc-1", from: "2026-01-01", to: "2026-01-31"
    ).call

    assert_equal 0.0, result[:total_spent]
    assert_equal 0, result[:transaction_count]
    assert_empty result[:monthly]
    assert_empty result[:daily]
  end

  private

  def mock_client(transactions)
    client = Object.new
    client.define_singleton_method(:transactions) do |**|
      { "page" => 1, "total" => transactions.size, "totalPages" => 1, "results" => transactions }
    end
    client
  end

  def mock_paginated_client
    pages = {
      1 => {
        "page" => 1, "totalPages" => 2,
        "results" => [
          { "id" => "tx-1", "amount" => 100.0, "date" => "2026-01-10T12:00:00Z" },
          { "id" => "tx-2", "amount" => 100.0, "date" => "2026-01-11T12:00:00Z" }
        ]
      },
      2 => {
        "page" => 2, "totalPages" => 2,
        "results" => [
          { "id" => "tx-3", "amount" => 100.0, "date" => "2026-01-12T12:00:00Z" }
        ]
      }
    }

    client = Object.new
    client.define_singleton_method(:transactions) do |page: 1, **|
      pages[page]
    end
    client
  end
end
