import os
import sys
import json
import numpy as np

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.database import Base
from app.models.job import Job
from app.models.resume import Resume
from app.services.resume_parser import ResumeParserService
from app.services.recommendation_engine import recommendation_engine
from app.services.job_fetcher import CURATED_TECH_JOBS, JobFetcherService
from app.services.embedding_service import embedding_service

def run_evaluation():
    print("=" * 60)
    print("      CAREERPILOT AI - AI OUTPUT EVALUATION SUITE       ")
    print("=" * 60)

    benchmark_path = os.path.join(os.path.dirname(__file__), "benchmark_data.json")
    with open(benchmark_path, "r") as f:
        benchmarks = json.load(f)

    # 1. Evaluate Resume Skill Extraction (Precision, Recall, F1)
    print("\n[Benchmark 1] Resume Skill Extraction Evaluation:")
    precisions, recalls, f1s = [], [], []

    for tc in benchmarks["parser_test_cases"]:
        parsed = ResumeParserService.parse_with_rule_engine(tc["text"])
        extracted_skills = set(s.lower().strip() for s in parsed.technical_skills)
        gt_skills = set(s.lower().strip() for s in tc["ground_truth_skills"])

        tp = len(extracted_skills.intersection(gt_skills))
        fp = len(extracted_skills - gt_skills)
        fn = len(gt_skills - extracted_skills)

        prec = tp / (tp + fp) if (tp + fp) > 0 else 1.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 1.0
        f1 = (2 * prec * rec) / (prec + rec) if (prec + rec) > 0 else 0.0

        precisions.append(prec)
        recalls.append(rec)
        f1s.append(f1)
        print(f"  Test Case '{tc['id']}': Precision={prec:.2f}, Recall={rec:.2f}, F1={f1:.2f}")

    mean_prec = np.mean(precisions)
    mean_rec = np.mean(recalls)
    mean_f1 = np.mean(f1s)
    print(f"--> Skill Extraction Mean F1 Score: {mean_f1 * 100:.1f}% (Precision: {mean_prec*100:.1f}%, Recall: {mean_rec*100:.1f}%)")

    # 2. Evaluate Recommendation Engine Ranking (MRR & Top-1 Accuracy)
    print("\n[Benchmark 2] Semantic Job Recommendation & Ranking Evaluation:")
    test_engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=test_engine)
    Session = sessionmaker(bind=test_engine)
    db = Session()

    # Seed curated jobs
    for j in CURATED_TECH_JOBS:
        vec = embedding_service.get_embedding(f"{j['title']} {j['description'][:500]}")
        db.add(Job(
            title=j["title"],
            company=j["company"],
            location=j["location"],
            remote_type=j["remote_type"],
            description=j["description"],
            requirements=j["requirements"],
            required_skills=j["required_skills"],
            experience_level=j["experience_level"],
            external_id=j["external_id"],
            embedding=vec
        ))
    db.commit()

    reciprocal_ranks = []
    top1_correct = 0

    for idx, r_tc in enumerate(benchmarks["recommendation_test_cases"]):
        # Mock resume
        mock_resume = Resume(
            user_id=f"eval-user-{idx}",
            file_name="eval_resume.pdf",
            file_type="application/pdf",
            raw_text=" ".join(r_tc["skills"]),
            parsed_json={
                "technical_skills": r_tc["skills"],
                "total_years_experience": 2.0
            },
            embedding=embedding_service.get_embedding(" ".join(r_tc["skills"])),
            is_active=True
        )

        ranked = recommendation_engine.rank_jobs_for_resume(db=db, resume=mock_resume, limit=10)
        matched_ranks = [i + 1 for i, job in enumerate(ranked) if job.external_id == r_tc["expected_best_match_id"]]
        
        if matched_ranks:
            rank = matched_ranks[0]
            reciprocal_ranks.append(1.0 / rank)
            if rank == 1:
                top1_correct += 1
            print(f"  Profile '{r_tc['candidate_title']}': Expected Job Ranked at #{rank}")
        else:
            reciprocal_ranks.append(0.0)
            print(f"  Profile '{r_tc['candidate_title']}': Expected Job NOT found in top 10")

    mrr = np.mean(reciprocal_ranks)
    top1_acc = (top1_correct / len(benchmarks["recommendation_test_cases"])) * 100
    print(f"--> Ranking Mean Reciprocal Rank (MRR): {mrr:.3f}")
    print(f"--> Top-1 Recommendation Accuracy: {top1_acc:.1f}%")

    print("\n" + "=" * 60)
    print("                   EVALUATION COMPLETE                  ")
    print("=" * 60)
    return {"mean_f1": mean_f1, "mrr": mrr, "top1_accuracy": top1_acc}

if __name__ == "__main__":
    run_evaluation()
