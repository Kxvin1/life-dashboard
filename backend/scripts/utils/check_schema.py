from app.db.database import engine
from sqlalchemy import inspect

def check_schema():
    inspector = inspect(engine)
    
    print('Tables:', inspector.get_table_names())
    
    if 'subscriptions' in inspector.get_table_names():
        print('\nSubscriptions columns:')
        for column in inspector.get_columns('subscriptions'):
            print(f'- {column["name"]}: {column["type"]}')
    else:
        print('\nSubscriptions table not found!')

if __name__ == "__main__":
    check_schema()
