from app.db.database import SessionLocal
from app.models.user import User
from app.models.subscription import Subscription

def check_demo_user():
    db = SessionLocal()
    try:
        # Get demo user
        demo_user = db.query(User).filter(User.email == 'demo_user@example.com').first()
        if not demo_user:
            print("Demo user not found!")
            return
        
        print(f"Demo user ID: {demo_user.id}")
        
        # Get subscriptions
        subscriptions = db.query(Subscription).filter(Subscription.user_id == demo_user.id).all()
        print(f"Number of subscriptions: {len(subscriptions)}")
        
        # Print subscription details
        for sub in subscriptions:
            print(f"- {sub.name} ({sub.status}): ${sub.amount} - Next payment: {sub.next_payment_date}")
    
    finally:
        db.close()

if __name__ == "__main__":
    check_demo_user()
