class CreateLabelsAndReplaceCategory < ActiveRecord::Migration[8.1]
  def up
    create_table :labels do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.timestamps
    end

    add_index :labels, [:user_id, :name], unique: true

    add_reference :transactions, :label, foreign_key: true, null: true
    add_column :transactions, :category_edited, :boolean, default: false, null: false

    # Create labels from distinct (user_id, category) pairs
    execute <<~SQL
      INSERT INTO labels (user_id, name, created_at, updated_at)
      SELECT DISTINCT a.user_id, t.category, NOW(), NOW()
      FROM transactions t
      JOIN accounts a ON a.id = t.account_id
      WHERE t.category IS NOT NULL
      ON CONFLICT (user_id, name) DO NOTHING
    SQL

    # Set label_id on transactions
    execute <<~SQL
      UPDATE transactions t
      SET label_id = l.id
      FROM accounts a, labels l
      WHERE t.account_id = a.id
        AND l.user_id = a.user_id
        AND l.name = t.category
    SQL

    # Set category_edited where user changed the category
    execute <<~SQL
      UPDATE transactions
      SET category_edited = true
      WHERE category IS NOT NULL
        AND original_category IS NOT NULL
        AND category != original_category
    SQL

    remove_index :transactions, :category
    remove_column :transactions, :category
  end

  def down
    add_column :transactions, :category, :string
    add_index :transactions, :category

    execute <<~SQL
      UPDATE transactions t
      SET category = l.name
      FROM labels l
      WHERE t.label_id = l.id
    SQL

    remove_reference :transactions, :label
    remove_column :transactions, :category_edited

    drop_table :labels
  end
end
