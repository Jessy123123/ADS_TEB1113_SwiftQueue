#include <iostream>
#include <vector>

using namespace std;

struct UserRequest{
    string sessionId;
    string userId;
    long long timestamp;
};

class BaselineQueue(){
    private:
        vector<UserRequest> requests; // unordered array of requests

        // helper function - get current time in milliseconds
        long long now(){
            return
            chrono::duration_cast<chrono::milliseconds>(chrono::system_clock::now().time_since_epoch()).count();
        }
    
    public:
        void enqueue(const string& sessionId, const string& userId, long long timestamp){
            UserRequest req = {sessionId, userId, timestamp};
            requests.push_back(req);
        }

        UserRequest dequeue(){
            if (requests.empty()){
                return {"Empty", "Empty", -1};
            }

            int minIndex = 0;
            for (int i = 1; i < (int)requests.size(); i++){
                if (requests[i].timestamp < requests[minIndex].timestamp){
                    minIndex = i;
                }
            }

            UserRequest removed = requests[minIndex];
            requests.erase(requests.begin() + minIndex);
            return removed;
        }

        void handleRefresh(const string& sessionId, const string& userId){
            enqueue(sessionId, userId, now());
        }

        int getPosition(const string& sessionId){
            for (int i = 0; i < (int)requests.size(); i++){
                if (requests[i].sessionId == sessionId){
                    return i;
                }
                return -1;
            }
        }

        bool isEmpty(){
            return requests.empty();
        }

        int size(){
            return (int)requests.size();
        }

        void printQueue(){
            cout << "  Queue (" << requests.size() << " entries): " << endl;
            for (int i = 0; i < (int)requests.size(); i++){
                std::cout << "    [" << i << "] "
                        << requests[i].userId
                        << "  session: " << requests[i].sessionId
                        << "  timestamp: " << requests[i].timestamp << "\n";
            }
        }
}

int main(){

    BaselineQueue queue;

    cout << "=== Ticketmaster Baseline Approach: Unordered Array ===\n\n";

    queue.enqueue("sess-A", "user-001", 1000);
    queue.enqueue("sess-B", "user-002", 2000);
    queue.enqueue("sess-C", "user-003", 3000);

    cout << "Step 1 — 3 users join:" << endl;
    queue.printQueue();
    cout << "  user-001 position: " << queue.getPosition("sess-A") << endl;
    cout << "  user-002 position: " << queue.getPosition("sess-B") << endl;
    cout << "  user-003 position: " << queue.getPosition("sess-C") << endl;

    queue.handleRefresh("sess-A", "user-001");

    cout << "Step 2 — user-001 refreshes the page:" << endl;
    queue.printQueue();
    cout << "  user-001 position: " << queue.getPosition("sess-A")
              << "  (stale old entry — misleading!)\n";
    cout << "  >> user-001 now has a DUPLICATE entry\n";
    cout << "  >> Their new entry is pushed to the back\n";

    cout << "\nStep 3 — Processing queue (each dequeue = O(n) scan):\n";
    int order = 1;
    while (!queue.isEmpty()) {
        UserRequest served = queue.dequeue();
            cout << "  #" << order++ << " Served: " << served.userId
                  << "  (timestamp: " << served.timestamp << ")\n";
    }
    
    return 0;
}