module Api
  class LabelsController < ApplicationController
    before_action :authenticate!

    def index
      labels = current_user.labels.order(:name)
      render json: labels.map { |l| { id: l.id, name: l.name } }
    end

    def create
      label = current_user.labels.create!(name: params.require(:name))
      render json: { id: label.id, name: label.name }, status: :created
    rescue ActiveRecord::RecordInvalid => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end
end
