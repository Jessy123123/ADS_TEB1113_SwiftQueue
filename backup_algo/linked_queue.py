import time 

class Node:
    def __init__(self,session_id, ticket_number):
        self.session_id = session_id
        self.ticket_number = ticket_number 
        self.timestamp = time.time() 
        self.next = None 

class LinkedQueue:
    def __init__(self):
        self._head = None 
        self._tail = None 
        self._size = 0 
        self._counter = 0 

    def enqueue(self, session_id):
        self._counter += 1
        node = Node(session_id, self._counter)
        if self._tail is None:
            self._head = node
            self._tail = node
        else:
            self._tail.next = node
            self._tail = node
        self._size += 1
        return node.ticket_number
    
    def dequeue(self):
        if self._head is None:
            return None
        node = self._head
        self._head = self._head.next
        if self._head is None: 
            self._tail = None
        self._size -= 1
        return node
    
    def get_size(self):
        return self._size
    
    def get_head(self):
        return self._head.ticket_number if self._head else None
    
    def find_position(self,session_id):
        position = 1
        current = self._head
        while current is not None:
            if current.session_id == session_id:
                return position
            current = current.next
            position += 1
        return None
    
    def get_queue_position(self,session_id):
        position = self.find_position(session_id)
        return f"#{position:03d},{self._counter:06d}" if position is not None else "Not found"
