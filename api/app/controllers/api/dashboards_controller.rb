module Api
  class DashboardsController < ApplicationController
    before_action :authenticate!

    def show
      render json: { message: "Welcome to Argus", user: { id: current_user.id, email: current_user.email } }
    end
  end
end
