module Api
  class TransactionsController < ApplicationController
    include TransactionSerialization

    before_action :authenticate!

    def index
      data = OpenFinance.client.transactions(
        account_id: params.require(:account_id),
        from: params.require(:from),
        to: params.require(:to),
        page: params.fetch(:page, 1),
        page_size: params.fetch(:page_size, 50)
      )
      render json: data
    rescue OpenFinance::Error => e
      render json: { error: e.message }, status: :bad_gateway
    end

    def update
      transaction = current_user.transactions.find(params[:id])
      permitted = params.permit(:category, :description).to_h.compact_blank
      transaction.update!(permitted) if permitted.any?
      render json: serialize_transaction(transaction)
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Transaction not found" }, status: :not_found
    end

    def destroy
      transaction = current_user.transactions.find(params[:id])
      transaction.soft_delete!
      head :no_content
    rescue ActiveRecord::RecordNotFound
      render json: { error: "Transaction not found" }, status: :not_found
    end

    def summary
      all_transactions = fetch_all_transactions(
        account_id: params.require(:account_id),
        from: params.require(:from),
        to: params.require(:to)
      )

      monthly = compute_monthly_summary(all_transactions)
      daily = compute_daily_summary(all_transactions)
      total_spent = all_transactions.sum { |t| expense_amount(t) }

      render json: {
        total_spent: total_spent.round(2),
        monthly: monthly,
        daily: daily,
        transaction_count: all_transactions.size
      }
    rescue OpenFinance::Error => e
      render json: { error: e.message }, status: :bad_gateway
    end

    private

    MAX_PAGES = 20

    def fetch_all_transactions(account_id:, from:, to:)
      all = []
      page = 1
      loop do
        data = OpenFinance.client.transactions(
          account_id: account_id, from: from, to: to,
          page: page, page_size: 500
        )
        all.concat(data["results"])
        break if page >= data["totalPages"] || page >= MAX_PAGES
        page += 1
      end
      all
    end

    def expense_amount(transaction)
      amount = transaction["amount"].to_f
      amount > 0 ? amount : 0
    end

    def compute_monthly_summary(transactions)
      transactions
        .group_by { |t| to_br_time(t["date"]).strftime("%Y-%m") }
        .transform_values { |txns| { spent: txns.sum { |t| expense_amount(t) }.round(2), count: txns.size } }
        .sort_by { |k, _| k }
        .to_h
    end

    def compute_daily_summary(transactions)
      transactions
        .group_by { |t| to_br_time(t["date"]).strftime("%Y-%m-%d") }
        .transform_values { |txns| { spent: txns.sum { |t| expense_amount(t) }.round(2), count: txns.size } }
        .sort_by { |k, _| k }
        .to_h
    end

    def to_br_time(iso_string)
      Time.zone.parse(iso_string)
    end

  end
end
