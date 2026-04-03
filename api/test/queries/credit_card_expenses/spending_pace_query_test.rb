require "test_helper"

class CreditCardExpenses::SpendingPaceQueryTest < ActiveSupport::TestCase
  setup do
    @user = users(:admin)
  end

  test "returns months hash with today and current_month" do
    result = CreditCardExpenses::SpendingPaceQuery.new(@user, months: 3).call

    assert result[:months].is_a?(Hash)
    assert result[:today].is_a?(Integer)
    assert result[:current_month].is_a?(String)
    assert_equal Date.current.day, result[:today]
    assert_equal Date.current.strftime("%Y-%m"), result[:current_month]
  end

  test "returns correct number of months" do
    result = CreditCardExpenses::SpendingPaceQuery.new(@user, months: 3).call
    assert_equal 3, result[:months].size
  end

  test "each month has label, days hash, and total" do
    result = CreditCardExpenses::SpendingPaceQuery.new(@user, months: 2).call

    result[:months].each do |_key, month_data|
      assert month_data[:label].is_a?(String)
      assert month_data[:days].is_a?(Hash)
      assert month_data[:total].is_a?(Float)
    end
  end

  test "cumulative values are non-decreasing" do
    result = CreditCardExpenses::SpendingPaceQuery.new(@user, months: 6).call

    result[:months].each do |_key, month_data|
      days = month_data[:days]
      sorted_days = days.sort_by { |day_num, _| day_num }
      sorted_days.each_cons(2) do |(_, val_a), (_, val_b)|
        assert val_b >= val_a, "Cumulative values should be non-decreasing"
      end
    end
  end

  test "march 2026 cumulative matches expected expenses" do
    # Fixtures: grocery_expense (day 15, 150), restaurant_expense (day 16, 85.50),
    # uncategorized_expense (day 17, 45), foreign_expense (day 18, 280 BRL)
    travel_to Date.new(2026, 3, 31) do
      result = CreditCardExpenses::SpendingPaceQuery.new(@user, months: 1).call
      march = result[:months]["2026-03"]

      assert_not_nil march
      assert_equal 0.0, march[:days][14] || 0.0
      assert_equal 150.0, march[:days][15]
      assert_equal 235.5, march[:days][16]
      assert_equal 280.5, march[:days][17]
      assert_equal 560.5, march[:days][18]
    end
  end

  test "does not include other user transactions" do
    travel_to Date.new(2026, 3, 31) do
      result = CreditCardExpenses::SpendingPaceQuery.new(@user, months: 1).call
      march = result[:months]["2026-03"]

      # other_user_tx is 200 on day 15. Admin's grocery is 150 on day 15.
      assert_equal 150.0, march[:days][15]
    end
  end

  test "returns zeros for months with no transactions" do
    travel_to Date.new(2026, 3, 31) do
      result = CreditCardExpenses::SpendingPaceQuery.new(@user, months: 6).call
      # October 2025 should have no data
      oct = result[:months]["2025-10"]
      assert_not_nil oct
      assert_equal 0.0, oct[:total]
    end
  end

  test "current month only includes days up to today" do
    travel_to Date.new(2026, 3, 15) do
      result = CreditCardExpenses::SpendingPaceQuery.new(@user, months: 1).call
      march = result[:months]["2026-03"]

      assert march[:days].keys.max <= 15
    end
  end
end
