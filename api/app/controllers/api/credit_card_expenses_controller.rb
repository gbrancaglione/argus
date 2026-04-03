module Api
  class CreditCardExpensesController < ApplicationController
    before_action :authenticate!

    def index
      result = CreditCardExpenses::ListQuery.new(
        current_user,
        from: params.require(:from),
        to: params.require(:to),
        page: params.fetch(:page, 1),
        per_page: params.fetch(:per_page, 50),
        label_name: params[:label_name]
      ).call

      render json: {
        results: TransactionSerializer.many(result[:results]),
        page: result[:page],
        total: result[:total],
        total_pages: result[:total_pages]
      }
    end

    def summary
      result = CreditCardExpenses::SummaryQuery.new(
        current_user,
        from: params.require(:from),
        to: params.require(:to)
      ).call

      render json: result
    end

    def analytics
      result = CreditCardExpenses::AnalyticsQuery.new(
        current_user,
        from: params.require(:from),
        to: params.require(:to),
        granularity: params.fetch(:granularity, "month")
      ).call

      render json: result
    end

    def spending_pace
      result = CreditCardExpenses::SpendingPaceQuery.new(
        current_user,
        months: params.fetch(:months, 6).to_i
      ).call

      render json: result
    end
  end
end
