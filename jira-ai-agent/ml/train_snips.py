# pip install scikit-learn matplotlib tensorflow

import os
import json
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, confusion_matrix, ConfusionMatrixDisplay
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Embedding, LSTM, Dense

BASE_PATH = "data/snips/2017-06-custom-intent-engines"

texts = []
labels = []

for intent_folder in os.listdir(BASE_PATH):
    intent_path = os.path.join(BASE_PATH, intent_folder)
    if os.path.isdir(intent_path):
        for file in os.listdir(intent_path):
            if file.startswith("train_") and file.endswith(".json"):
                file_path = os.path.join(intent_path, file)
                print("Reading:", file_path)

                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    obj = json.load(f)

                    # Your JSON format: { "IntentName": [ { "data": [...] }, ... ] }
                    for intent_name, examples in obj.items():
                        for ex in examples:
                            if "data" in ex:
                                sentence = ""
                                for part in ex["data"]:
                                    if "text" in part:
                                        sentence += part["text"]
                                sentence = sentence.strip()
                                if sentence:
                                    texts.append(sentence)
                                    labels.append(intent_name)

print("Total samples:", len(texts))

if len(texts) == 0:
    raise ValueError("No data found! Check dataset path.")

print("Sample text:", texts[0])
print("Sample label:", labels[0])

# Encode labels
le = LabelEncoder()
y = le.fit_transform(labels)

# Tokenize text
tokenizer = Tokenizer(num_words=10000, oov_token="<OOV>")
tokenizer.fit_on_texts(texts)
X_seq = tokenizer.texts_to_sequences(texts)
X_pad = pad_sequences(X_seq, maxlen=20)

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X_pad, y, test_size=0.2, random_state=42
)

# Build model
model = Sequential([
    Embedding(10000, 64, input_length=20),
    LSTM(64),
    Dense(len(np.unique(y)), activation="softmax")
])

model.compile(
    loss="sparse_categorical_crossentropy",
    optimizer="adam",
    metrics=["accuracy"]
)

# Train for 10 epochs
model.fit(
    X_train, y_train,
    epochs=10,
    batch_size=32,
    validation_split=0.1
)

# Evaluate
y_pred_probs = model.predict(X_test)
y_pred = np.argmax(y_pred_probs, axis=1)

print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=le.classes_))

# Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=le.classes_)
disp.plot(xticks_rotation=45)
plt.title("Confusion Matrix - SNIPS")
plt.tight_layout()
plt.savefig("confusion_matrix.png")
print("Confusion matrix saved as confusion_matrix.png")

# Save model
model.save("snips_intent_model.h5")
print("Model saved as snips_intent_model.h5")

import pickle

with open("tokenizer.pkl", "wb") as f:
    pickle.dump(tokenizer, f)

with open("label_encoder.pkl", "wb") as f:
    pickle.dump(le, f)

print("Tokenizer and LabelEncoder saved")