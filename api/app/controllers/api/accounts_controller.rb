module Api
  class AccountsController < ApplicationController
    before_action :authenticate!

    def index
      data = OpenFinance.client.accounts
      render json: data
    rescue OpenFinance::Error => e
      render json: { error: e.message }, status: :bad_gateway
    end
  end
end
