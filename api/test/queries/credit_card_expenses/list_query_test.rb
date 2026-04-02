require "test_helper"

class CreditCardExpenses::ListQueryTest < ActiveSupport::TestCase
  setup do
    @user = users(:admin)
  end

  test "returns only credit card transactions in date range" do
    result = CreditCardExpenses::ListQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    descriptions = result[:results].map(&:description)
    assert_includes descriptions, "Supermercado Extra"
    assert_includes descriptions, "Restaurante Fasano"
    assert_includes descriptions, "Amazon.com"
    assert_not_includes descriptions, "Pagamento de fatura"
  end

  test "excludes card payment transactions" do
    result = CreditCardExpenses::ListQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    categories = result[:results].map(&:original_category)
    assert_not_includes categories, "Credit card payment"
  end

  test "excludes other user transactions" do
    result = CreditCardExpenses::ListQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    external_ids = result[:results].map(&:external_id)
    assert_not_includes external_ids, "tx-5"
  end

  test "paginates results" do
    result = CreditCardExpenses::ListQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31", page: 1, per_page: 2
    ).call

    assert_equal 2, result[:results].size
    assert_equal 1, result[:page]
    assert_equal 3, result[:total]
    assert_equal 2, result[:total_pages]
  end

  test "returns second page" do
    result = CreditCardExpenses::ListQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31", page: 2, per_page: 2
    ).call

    assert_equal 1, result[:results].size
    assert_equal 2, result[:page]
  end

  test "orders by date desc then created_at desc" do
    result = CreditCardExpenses::ListQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    dates = result[:results].map(&:date)
    assert_equal dates, dates.sort.reverse
  end

  test "returns minimum total_pages of 1 when no results" do
    result = CreditCardExpenses::ListQuery.new(
      @user, from: "2020-01-01", to: "2020-01-31"
    ).call

    assert_equal 0, result[:total]
    assert_equal 1, result[:total_pages]
  end
end
