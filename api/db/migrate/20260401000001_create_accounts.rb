class CreateAccounts < ActiveRecord::Migration[8.1]
  def change
    create_table :accounts do |t|
      t.references :user, null: false, foreign_key: true
      t.string :external_id, null: false
      t.string :item_id, null: false
      t.string :name, null: false
      t.string :account_type, null: false
      t.string :account_subtype
      t.string :currency_code, default: "BRL"
      t.decimal :balance, precision: 12, scale: 2
      t.jsonb :raw_data, default: {}
      t.timestamps
    end

    add_index :accounts, [:user_id, :external_id], unique: true
    add_index :accounts, :account_type
  end
end
