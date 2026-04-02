require "test_helper"

class CreditCardExpenses::SummaryQueryTest < ActiveSupport::TestCase
  setup do
    @user = users(:admin)
  end

  test "returns total spent using BRL amounts" do
    result = CreditCardExpenses::SummaryQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    # grocery(150) + restaurant(85.50) + foreign(280 brl) = 515.50
    assert_equal 515.5, result[:total_spent]
  end

  test "returns transaction count excluding card payments" do
    result = CreditCardExpenses::SummaryQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    assert_equal 3, result[:transaction_count]
  end

  test "returns monthly breakdown" do
    result = CreditCardExpenses::SummaryQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    assert result[:monthly].key?("2026-03")
    assert_equal 515.5, result[:monthly]["2026-03"][:spent]
    assert_equal 3, result[:monthly]["2026-03"][:count]
  end

  test "returns daily breakdown" do
    result = CreditCardExpenses::SummaryQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    assert result[:daily].key?("2026-03-15")
    assert_equal 150.0, result[:daily]["2026-03-15"][:spent]
  end

  test "returns category breakdown" do
    result = CreditCardExpenses::SummaryQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    categories = result[:by_category].map { |c| c[:category] }
    assert_includes categories, "Groceries"
    assert_includes categories, "Shopping"
    assert_not_includes categories, "Credit card payment"
  end

  test "returns zeros when no matching transactions" do
    result = CreditCardExpenses::SummaryQuery.new(
      @user, from: "2020-01-01", to: "2020-01-31"
    ).call

    assert_equal 0.0, result[:total_spent]
    assert_equal 0, result[:transaction_count]
    assert_empty result[:monthly]
    assert_empty result[:daily]
    assert_empty result[:by_category]
  end
end
