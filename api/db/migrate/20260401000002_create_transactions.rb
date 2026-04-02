class CreateTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :transactions do |t|
      t.references :account, null: false, foreign_key: true
      t.string :external_id, null: false
      t.date :date, null: false
      t.decimal :amount, precision: 12, scale: 2, null: false
      t.decimal :amount_brl, precision: 12, scale: 2
      t.string :currency_code, default: "BRL"
      t.string :description
      t.string :original_category
      t.string :category
      t.string :transaction_type, null: false
      t.string :status
      t.string :payment_method
      t.jsonb :raw_data, default: {}
      t.timestamps
    end

    add_index :transactions, :external_id, unique: true
    add_index :transactions, [:account_id, :date]
    add_index :transactions, :category
  end
end
