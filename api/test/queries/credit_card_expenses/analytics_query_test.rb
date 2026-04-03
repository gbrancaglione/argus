require "test_helper"

class CreditCardExpenses::AnalyticsQueryTest < ActiveSupport::TestCase
  setup do
    @user = users(:admin)
  end

  test "returns current period stats" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    current = result[:current_period]
    assert current[:total_spent] > 0
    assert current[:transaction_count] > 0
    assert current[:daily_average] > 0
    assert_equal "2026-03-01", current[:from]
    assert_equal "2026-03-31", current[:to]
  end

  test "returns previous period stats mirroring date range" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    previous = result[:previous_period]
    # March has 31 days, so previous period should be 31 days before March 1
    assert_equal "2026-01-29", previous[:from]
    assert_equal "2026-02-28", previous[:to]
  end

  test "returns monthly trend" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    assert result[:monthly_trend].key?("2026-03")
    march = result[:monthly_trend]["2026-03"]
    assert march[:spent] > 0
    assert march[:count] > 0
  end

  test "returns category monthly trend" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    trend = result[:category_trend]
    assert trend.key?("Groceries")
    assert trend["Groceries"].key?("2026-03")
    assert_equal 150.0, trend["Groceries"]["2026-03"]
  end

  test "returns top categories sorted by spend" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    top = result[:top_categories]
    assert top.is_a?(Array)
    assert top.length > 0

    # Should be sorted by spent DESC
    spends = top.map { |c| c[:spent] }
    assert_equal spends, spends.sort.reverse

    # Each entry has percentage
    top.each do |cat|
      assert cat.key?(:percentage)
      assert cat.key?(:count)
    end
  end

  test "granularity week returns week-keyed data" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31", granularity: "week"
    ).call

    result[:monthly_trend].each_key do |key|
      assert_match(/\A\d{4}-W\d{2}\z/, key, "Week key should match YYYY-Wnn format")
    end
  end

  test "granularity day returns day-keyed data" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31", granularity: "day"
    ).call

    result[:monthly_trend].each_key do |key|
      assert_match(/\A\d{4}-\d{2}-\d{2}\z/, key, "Day key should match YYYY-MM-DD format")
    end
  end

  test "default granularity is monthly" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31"
    ).call

    result[:monthly_trend].each_key do |key|
      assert_match(/\A\d{4}-\d{2}\z/, key, "Month key should match YYYY-MM format")
    end
  end

  test "invalid granularity falls back to month" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2026-03-01", to: "2026-03-31", granularity: "invalid"
    ).call

    result[:monthly_trend].each_key do |key|
      assert_match(/\A\d{4}-\d{2}\z/, key)
    end
  end

  test "returns zeros for empty periods" do
    result = CreditCardExpenses::AnalyticsQuery.new(
      @user, from: "2020-01-01", to: "2020-01-31"
    ).call

    assert_equal 0.0, result[:current_period][:total_spent]
    assert_equal 0, result[:current_period][:transaction_count]
    assert_empty result[:monthly_trend]
    assert_empty result[:top_categories]
  end
end
