Rails.application.routes.draw do
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    resource :session, only: [:create, :destroy]
    resource :dashboard, only: [:show]
    resources :accounts, only: [:index]
    resources :labels, only: [:index, :create]
    resources :transactions, only: [:index, :update, :destroy] do
      collection do
        get :summary
        patch :bulk_update
      end
    end
    resources :syncs, only: [:create, :index] do
      member do
        patch :approve
        patch :reject
      end
      resources :transactions, only: [:index], controller: "sync_transactions"
    end
    resources :credit_card_expenses, only: [:index] do
      collection do
        get :summary
        get :analytics
        get :spending_pace
      end
    end
  end
end
