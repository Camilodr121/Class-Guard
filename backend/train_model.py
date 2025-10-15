# backend/train_model.py
"""
Script para entrenar el modelo inicial con datos sintéticos
"""
from app.services.ml_service.classifier import AttentionClassifier
from app.services.ml_service.data_generator import SyntheticDataGenerator

def train_initial_model():
    print("🎓 Entrenando modelo inicial de clasificación de atención...")
    print("=" * 60)
    
    # Generar datos sintéticos
    print("\n📊 Generando datos sintéticos...")
    X, y = SyntheticDataGenerator.generate_training_data(n_samples=3000)
    print(f"   Generadas {len(X)} muestras con {X.shape[1]} features")
    print(f"   Distribución de clases: LOW={sum(y==0)}, MEDIUM={sum(y==1)}, HIGH={sum(y==2)}")
    
    # Crear y entrenar clasificador
    print("\n🤖 Entrenando clasificador...")
    classifier = AttentionClassifier()
    
    metrics = classifier.train(X, y, model_type='random_forest')
    
    # Mostrar resultados
    print("\n📈 Resultados del Entrenamiento:")
    print(f"   Train Accuracy: {metrics['train_accuracy']:.3f}")
    print(f"   Test Accuracy:  {metrics['test_accuracy']:.3f}")
    print(f"   CV Score:       {metrics['cv_mean']:.3f} (+/- {metrics['cv_std']:.3f})")
    
    print("\n📊 Classification Report:")
    report = metrics['classification_report']
    for class_name in ['LOW', 'MEDIUM', 'HIGH']:
        class_metrics = report[class_name]
        print(f"   {class_name:8s} - Precision: {class_metrics['precision']:.3f}, "
              f"Recall: {class_metrics['recall']:.3f}, "
              f"F1-Score: {class_metrics['f1-score']:.3f}")
    
    # Importancia de features
    print("\n🔍 Top 10 Features Más Importantes:")
    importance = classifier.get_feature_importance()
    sorted_features = sorted(importance.items(), key=lambda x: x[1], reverse=True)
    for i, (feature, imp) in enumerate(sorted_features[:10], 1):
        print(f"   {i:2d}. {feature:30s}: {imp:.4f}")
    
    print("\n✅ ¡Modelo entrenado y guardado exitosamente!")
    print("=" * 60)

if __name__ == "__main__":
    train_initial_model()