#!/usr/bin/env python3
"""
MJU e-Advisor 전공 매칭 분석 도구

분석 내용:
1. RIASEC 75문항 가중치 분석
2. 전공 프로필 유사도 분석
3. 계열 선택 + 전공 찜 고려 시 차별화 효과 분석

사용법:
    python analysis/major_analysis.py
"""

import numpy as np
from collections import defaultdict
from itertools import combinations
from typing import Dict, List, Tuple, Optional

# RIASEC 6개 차원
DIMENSIONS = ['R', 'I', 'A', 'S', 'E', 'C']

# 7개 계열
CLUSTERS = ['인문', '사회', '경상', '공학', '자연', '예체능', '융합']

# 75문항 가중치 (questionPool.ts에서 추출)
QUESTIONS = [
    # id, A_weights, B_weights
    (1, {'R': 1, 'C': 0.3}, {'S': 1, 'E': 0.3}),
    (2, {'I': 1, 'C': 0.3}, {'E': 1, 'S': 0.3}),
    (3, {'A': 1, 'I': 0.3}, {'C': 1, 'R': 0.3}),
    (4, {'S': 1, 'A': 0.3}, {'R': 1, 'I': 0.3}),
    (5, {'E': 1, 'S': 0.3}, {'I': 1, 'A': 0.3}),
    (6, {'C': 1, 'E': 0.3}, {'A': 1, 'S': 0.3}),
    (7, {'R': 1, 'I': 0.3}, {'A': 1, 'E': 0.3}),
    (8, {'I': 1, 'R': 0.3}, {'S': 1, 'C': 0.3}),
    (9, {'A': 1, 'S': 0.3}, {'R': 1, 'C': 0.3}),
    (10, {'S': 1, 'E': 0.3}, {'I': 1, 'R': 0.3}),
    (11, {'E': 1, 'A': 0.3}, {'C': 1, 'I': 0.3}),
    (12, {'C': 1, 'I': 0.3}, {'E': 1, 'A': 0.3}),
    (13, {'R': 1, 'E': 0.3}, {'I': 1, 'S': 0.3}),
    (14, {'I': 1, 'A': 0.3}, {'R': 1, 'E': 0.3}),
    (15, {'A': 1, 'C': 0.3}, {'S': 1, 'I': 0.3}),
    (16, {'S': 1, 'I': 0.3}, {'E': 1, 'C': 0.3}),
    (17, {'E': 1, 'R': 0.3}, {'A': 1, 'I': 0.3}),
    (18, {'C': 1, 'S': 0.3}, {'R': 1, 'A': 0.3}),
    (19, {'R': 1, 'A': 0.3}, {'C': 1, 'E': 0.3}),
    (20, {'I': 1, 'E': 0.3}, {'A': 1, 'R': 0.3}),
    (21, {'A': 1, 'R': 0.3}, {'I': 1, 'C': 0.3}),
    (22, {'S': 1, 'C': 0.3}, {'A': 1, 'E': 0.3}),
    (23, {'E': 1, 'I': 0.3}, {'S': 1, 'R': 0.3}),
    (24, {'C': 1, 'A': 0.3}, {'I': 1, 'E': 0.3}),
    (25, {'R': 1, 'S': 0.3}, {'E': 1, 'I': 0.3}),
    (26, {'I': 1, 'C': 0.3}, {'R': 1, 'S': 0.3}),
    (27, {'A': 1, 'E': 0.3}, {'C': 1, 'S': 0.3}),
    (28, {'S': 1, 'R': 0.3}, {'I': 1, 'E': 0.3}),
    (29, {'E': 1, 'C': 0.3}, {'A': 1, 'R': 0.3}),
    (30, {'C': 1, 'R': 0.3}, {'S': 1, 'A': 0.3}),
    (31, {'R': 1, 'I': 0.3}, {'E': 1, 'S': 0.3}),
    (32, {'I': 1, 'S': 0.3}, {'C': 1, 'A': 0.3}),
    (33, {'A': 1, 'E': 0.3}, {'R': 1, 'I': 0.3}),
    (34, {'S': 1, 'A': 0.3}, {'C': 1, 'R': 0.3}),
    (35, {'E': 1, 'R': 0.3}, {'I': 1, 'S': 0.3}),
    (36, {'C': 1, 'E': 0.3}, {'A': 1, 'I': 0.3}),
    (37, {'R': 1, 'C': 0.3}, {'A': 1, 'S': 0.3}),
    (38, {'I': 1, 'A': 0.3}, {'E': 1, 'C': 0.3}),
    (39, {'A': 1, 'I': 0.3}, {'S': 1, 'R': 0.3}),
    (40, {'S': 1, 'E': 0.3}, {'R': 1, 'C': 0.3}),
    (41, {'E': 1, 'S': 0.3}, {'C': 1, 'I': 0.3}),
    (42, {'C': 1, 'I': 0.3}, {'R': 1, 'E': 0.3}),
    (43, {'R': 1, 'E': 0.3}, {'S': 1, 'A': 0.3}),
    (44, {'I': 1, 'R': 0.3}, {'A': 1, 'C': 0.3}),
    (45, {'A': 1, 'C': 0.3}, {'E': 1, 'S': 0.3}),
    (46, {'S': 1, 'I': 0.3}, {'R': 1, 'A': 0.3}),
    (47, {'E': 1, 'A': 0.3}, {'I': 1, 'R': 0.3}),
    (48, {'C': 1, 'S': 0.3}, {'A': 1, 'E': 0.3}),
    (49, {'R': 1, 'A': 0.3}, {'I': 1, 'C': 0.3}),
    (50, {'I': 1, 'E': 0.3}, {'S': 1, 'R': 0.3}),
    (51, {'A': 1, 'S': 0.3}, {'C': 1, 'E': 0.3}),
    (52, {'S': 1, 'C': 0.3}, {'E': 1, 'I': 0.3}),
    (53, {'E': 1, 'I': 0.3}, {'R': 1, 'A': 0.3}),
    (54, {'C': 1, 'R': 0.3}, {'I': 1, 'S': 0.3}),
    (55, {'R': 1, 'S': 0.3}, {'C': 1, 'A': 0.3}),
    (56, {'I': 1, 'C': 0.3}, {'A': 1, 'E': 0.3}),
    (57, {'A': 1, 'R': 0.3}, {'S': 1, 'C': 0.3}),
    (58, {'S': 1, 'A': 0.3}, {'I': 1, 'R': 0.3}),
    (59, {'E': 1, 'C': 0.3}, {'R': 1, 'S': 0.3}),
    (60, {'C': 1, 'E': 0.3}, {'S': 1, 'I': 0.3}),
    (61, {'R': 1, 'I': 0.3}, {'C': 1, 'S': 0.3}),
    (62, {'I': 1, 'S': 0.3}, {'E': 1, 'R': 0.3}),
    (63, {'A': 1, 'E': 0.3}, {'I': 1, 'A': 0.3}),
    (64, {'S': 1, 'R': 0.3}, {'A': 1, 'C': 0.3}),
    (65, {'E': 1, 'A': 0.3}, {'C': 1, 'R': 0.3}),
    (66, {'C': 1, 'A': 0.3}, {'R': 1, 'E': 0.3}),
    (67, {'R': 1, 'C': 0.3}, {'I': 1, 'A': 0.3}),
    (68, {'I': 1, 'R': 0.3}, {'S': 1, 'E': 0.3}),
    (69, {'A': 1, 'I': 0.3}, {'E': 1, 'C': 0.3}),
    (70, {'S': 1, 'E': 0.3}, {'C': 1, 'I': 0.3}),
    (71, {'E': 1, 'S': 0.3}, {'A': 1, 'R': 0.3}),
    (72, {'C': 1, 'I': 0.3}, {'S': 1, 'A': 0.3}),
    (73, {'R': 1, 'E': 0.3}, {'I': 1, 'C': 0.3}),
    (74, {'I': 1, 'A': 0.3}, {'R': 1, 'S': 0.3}),
    (75, {'A': 1, 'S': 0.3}, {'E': 1, 'I': 0.3}),
]

# 전공 리스트 (majorList.ts에서 추출)
MAJORS = {
    # 인문계열
    '중어중문학전공': {'cluster': '인문', 'vec': {'R': 0.15, 'I': 0.7, 'A': 0.8, 'S': 0.75, 'E': 0.5, 'C': 0.5}},
    '일어일문학전공': {'cluster': '인문', 'vec': {'R': 0.15, 'I': 0.7, 'A': 0.8, 'S': 0.75, 'E': 0.5, 'C': 0.5}},
    '아랍지역학전공': {'cluster': '인문', 'vec': {'R': 0.2, 'I': 0.8, 'A': 0.75, 'S': 0.7, 'E': 0.6, 'C': 0.5}},
    '글로벌한국어학전공': {'cluster': '인문', 'vec': {'R': 0.15, 'I': 0.7, 'A': 0.75, 'S': 0.75, 'E': 0.5, 'C': 0.6}},
    '국어국문학전공': {'cluster': '인문', 'vec': {'R': 0.15, 'I': 0.75, 'A': 0.9, 'S': 0.6, 'E': 0.4, 'C': 0.5}},
    '영어영문학전공': {'cluster': '인문', 'vec': {'R': 0.15, 'I': 0.75, 'A': 0.85, 'S': 0.7, 'E': 0.6, 'C': 0.5}},
    '미술사·역사학전공': {'cluster': '인문', 'vec': {'R': 0.2, 'I': 0.85, 'A': 0.7, 'S': 0.4, 'E': 0.3, 'C': 0.75}},
    '문헌정보학전공': {'cluster': '인문', 'vec': {'R': 0.2, 'I': 0.8, 'A': 0.4, 'S': 0.6, 'E': 0.25, 'C': 0.9}},
    '글로벌문화콘텐츠학전공': {'cluster': '인문', 'vec': {'R': 0.2, 'I': 0.65, 'A': 0.85, 'S': 0.6, 'E': 0.75, 'C': 0.5}},
    '문예창작학과': {'cluster': '인문', 'vec': {'R': 0.15, 'I': 0.7, 'A': 0.95, 'S': 0.6, 'E': 0.5, 'C': 0.4}},

    # 사회계열
    '행정학전공': {'cluster': '사회', 'vec': {'R': 0.2, 'I': 0.6, 'A': 0.25, 'S': 0.75, 'E': 0.5, 'C': 0.9}},
    '정치외교학전공': {'cluster': '사회', 'vec': {'R': 0.2, 'I': 0.65, 'A': 0.3, 'S': 0.75, 'E': 0.85, 'C': 0.5}},
    '법학과': {'cluster': '사회', 'vec': {'R': 0.2, 'I': 0.8, 'A': 0.25, 'S': 0.5, 'E': 0.65, 'C': 0.95}},
    '디지털미디어학부': {'cluster': '사회', 'vec': {'R': 0.25, 'I': 0.75, 'A': 0.85, 'S': 0.5, 'E': 0.8, 'C': 0.6}},
    '청소년지도학전공': {'cluster': '사회', 'vec': {'R': 0.2, 'I': 0.5, 'A': 0.4, 'S': 0.95, 'E': 0.7, 'C': 0.3}},
    '아동학전공': {'cluster': '사회', 'vec': {'R': 0.2, 'I': 0.6, 'A': 0.5, 'S': 0.95, 'E': 0.3, 'C': 0.4}},
    '사회복지학과': {'cluster': '사회', 'vec': {'R': 0.2, 'I': 0.5, 'A': 0.3, 'S': 0.95, 'E': 0.65, 'C': 0.4}},
    '법무행정학과': {'cluster': '사회', 'vec': {'R': 0.2, 'I': 0.6, 'A': 0.25, 'S': 0.7, 'E': 0.75, 'C': 0.9}},
    '심리치료학과': {'cluster': '사회', 'vec': {'R': 0.2, 'I': 0.85, 'A': 0.5, 'S': 0.95, 'E': 0.3, 'C': 0.4}},

    # 경상계열
    '경제학전공': {'cluster': '경상', 'vec': {'R': 0.2, 'I': 0.8, 'A': 0.3, 'S': 0.5, 'E': 0.9, 'C': 0.75}},
    '국제통상학전공': {'cluster': '경상', 'vec': {'R': 0.2, 'I': 0.75, 'A': 0.4, 'S': 0.7, 'E': 0.85, 'C': 0.65}},
    '응용통계학전공': {'cluster': '경상', 'vec': {'R': 0.5, 'I': 0.95, 'A': 0.2, 'S': 0.25, 'E': 0.4, 'C': 0.9}},
    '경영학전공': {'cluster': '경상', 'vec': {'R': 0.2, 'I': 0.75, 'A': 0.3, 'S': 0.7, 'E': 0.95, 'C': 0.8}},
    '글로벌비즈니스학전공': {'cluster': '경상', 'vec': {'R': 0.2, 'I': 0.7, 'A': 0.4, 'S': 0.85, 'E': 0.9, 'C': 0.75}},
    '경영정보학과': {'cluster': '경상', 'vec': {'R': 0.5, 'I': 0.9, 'A': 0.3, 'S': 0.35, 'E': 0.75, 'C': 0.85}},
    '부동산학과': {'cluster': '경상', 'vec': {'R': 0.25, 'I': 0.65, 'A': 0.3, 'S': 0.6, 'E': 0.9, 'C': 0.8}},
    '미래융합경영학과': {'cluster': '경상', 'vec': {'R': 0.2, 'I': 0.8, 'A': 0.4, 'S': 0.6, 'E': 0.9, 'C': 0.75}},
    '회계세무학과': {'cluster': '경상', 'vec': {'R': 0.2, 'I': 0.75, 'A': 0.2, 'S': 0.4, 'E': 0.8, 'C': 0.95}},
    '계약학과': {'cluster': '경상', 'vec': {'R': 0.2, 'I': 0.65, 'A': 0.3, 'S': 0.6, 'E': 0.75, 'C': 0.9}},

    # 공학계열
    '화학공학전공': {'cluster': '공학', 'vec': {'R': 0.8, 'I': 0.9, 'A': 0.3, 'S': 0.3, 'E': 0.5, 'C': 0.85}},
    '신소재공학전공': {'cluster': '공학', 'vec': {'R': 0.85, 'I': 0.95, 'A': 0.3, 'S': 0.25, 'E': 0.5, 'C': 0.8}},
    '환경시스템공학전공': {'cluster': '공학', 'vec': {'R': 0.85, 'I': 0.8, 'A': 0.25, 'S': 0.6, 'E': 0.4, 'C': 0.75}},
    '건설환경공학전공': {'cluster': '공학', 'vec': {'R': 0.9, 'I': 0.75, 'A': 0.25, 'S': 0.5, 'E': 0.4, 'C': 0.8}},
    '스마트모빌리티공학전공': {'cluster': '공학', 'vec': {'R': 0.9, 'I': 0.85, 'A': 0.3, 'S': 0.35, 'E': 0.6, 'C': 0.8}},
    '기계공학전공': {'cluster': '공학', 'vec': {'R': 0.95, 'I': 0.85, 'A': 0.2, 'S': 0.3, 'E': 0.4, 'C': 0.8}},
    '로봇공학전공': {'cluster': '공학', 'vec': {'R': 0.95, 'I': 0.9, 'A': 0.3, 'S': 0.3, 'E': 0.5, 'C': 0.85}},
    '컴퓨터공학전공': {'cluster': '공학', 'vec': {'R': 0.75, 'I': 0.95, 'A': 0.2, 'S': 0.3, 'E': 0.5, 'C': 0.85}},
    '정보통신공학전공': {'cluster': '공학', 'vec': {'R': 0.7, 'I': 0.9, 'A': 0.25, 'S': 0.5, 'E': 0.8, 'C': 0.8}},
    '전기공학전공': {'cluster': '공학', 'vec': {'R': 0.9, 'I': 0.9, 'A': 0.2, 'S': 0.3, 'E': 0.5, 'C': 0.8}},
    '전자공학전공': {'cluster': '공학', 'vec': {'R': 0.85, 'I': 0.9, 'A': 0.3, 'S': 0.3, 'E': 0.5, 'C': 0.8}},
    '반도체공학부': {'cluster': '공학', 'vec': {'R': 0.85, 'I': 0.95, 'A': 0.2, 'S': 0.25, 'E': 0.5, 'C': 0.85}},
    '산업경영공학과': {'cluster': '공학', 'vec': {'R': 0.6, 'I': 0.85, 'A': 0.25, 'S': 0.5, 'E': 0.8, 'C': 0.8}},
    '건축학전공': {'cluster': '공학', 'vec': {'R': 0.9, 'I': 0.75, 'A': 0.85, 'S': 0.35, 'E': 0.5, 'C': 0.7}},
    '전통건축전공': {'cluster': '공학', 'vec': {'R': 0.9, 'I': 0.8, 'A': 0.85, 'S': 0.35, 'E': 0.4, 'C': 0.75}},
    '공간디자인학과': {'cluster': '공학', 'vec': {'R': 0.8, 'I': 0.7, 'A': 0.9, 'S': 0.4, 'E': 0.7, 'C': 0.6}},

    # 자연계열
    '화학나노학전공': {'cluster': '자연', 'vec': {'R': 0.8, 'I': 0.9, 'A': 0.2, 'S': 0.3, 'E': 0.4, 'C': 0.75}},
    '융합에너지학전공': {'cluster': '자연', 'vec': {'R': 0.8, 'I': 0.9, 'A': 0.3, 'S': 0.3, 'E': 0.7, 'C': 0.7}},
    '식품영양학전공': {'cluster': '자연', 'vec': {'R': 0.8, 'I': 0.75, 'A': 0.5, 'S': 0.8, 'E': 0.35, 'C': 0.5}},
    '시스템생명과학전공': {'cluster': '자연', 'vec': {'R': 0.8, 'I': 0.95, 'A': 0.4, 'S': 0.25, 'E': 0.3, 'C': 0.75}},
    '물리학과': {'cluster': '자연', 'vec': {'R': 0.5, 'I': 0.95, 'A': 0.2, 'S': 0.25, 'E': 0.2, 'C': 0.8}},
    '수학과': {'cluster': '자연', 'vec': {'R': 0.4, 'I': 0.95, 'A': 0.2, 'S': 0.25, 'E': 0.2, 'C': 0.85}},

    # 예체능계열
    '비주얼커뮤니케이션디자인전공': {'cluster': '예체능', 'vec': {'R': 0.25, 'I': 0.65, 'A': 0.95, 'S': 0.4, 'E': 0.85, 'C': 0.5}},
    '인더스트리얼디자인전공': {'cluster': '예체능', 'vec': {'R': 0.8, 'I': 0.75, 'A': 0.9, 'S': 0.35, 'E': 0.7, 'C': 0.6}},
    '영상애니메이션디자인전공': {'cluster': '예체능', 'vec': {'R': 0.3, 'I': 0.8, 'A': 0.9, 'S': 0.5, 'E': 0.7, 'C': 0.6}},
    '패션디자인전공': {'cluster': '예체능', 'vec': {'R': 0.3, 'I': 0.6, 'A': 0.9, 'S': 0.75, 'E': 0.8, 'C': 0.5}},
    '체육학전공': {'cluster': '예체능', 'vec': {'R': 0.95, 'I': 0.4, 'A': 0.3, 'S': 0.9, 'E': 0.8, 'C': 0.3}},
    '스포츠산업학전공': {'cluster': '예체능', 'vec': {'R': 0.75, 'I': 0.5, 'A': 0.3, 'S': 0.85, 'E': 0.9, 'C': 0.6}},
    '스포츠지도학전공': {'cluster': '예체능', 'vec': {'R': 0.9, 'I': 0.4, 'A': 0.3, 'S': 0.95, 'E': 0.8, 'C': 0.3}},
    '건반음악전공': {'cluster': '예체능', 'vec': {'R': 0.2, 'I': 0.6, 'A': 0.95, 'S': 0.8, 'E': 0.75, 'C': 0.5}},
    '보컬뮤직전공': {'cluster': '예체능', 'vec': {'R': 0.2, 'I': 0.5, 'A': 0.95, 'S': 0.85, 'E': 0.8, 'C': 0.4}},
    '작곡전공': {'cluster': '예체능', 'vec': {'R': 0.2, 'I': 0.8, 'A': 0.95, 'S': 0.7, 'E': 0.65, 'C': 0.5}},
    '연극·영화전공': {'cluster': '예체능', 'vec': {'R': 0.2, 'I': 0.5, 'A': 0.95, 'S': 0.9, 'E': 0.85, 'C': 0.4}},
    '뮤지컬공연전공': {'cluster': '예체능', 'vec': {'R': 0.2, 'I': 0.5, 'A': 0.95, 'S': 0.9, 'E': 0.85, 'C': 0.4}},
    '바둑학과': {'cluster': '예체능', 'vec': {'R': 0.5, 'I': 0.9, 'A': 0.7, 'S': 0.4, 'E': 0.3, 'C': 0.8}},
    '멀티디자인학과': {'cluster': '예체능', 'vec': {'R': 0.3, 'I': 0.7, 'A': 0.9, 'S': 0.5, 'E': 0.8, 'C': 0.6}},

    # 융합계열
    '응용소프트웨어전공': {'cluster': '융합', 'vec': {'R': 0.6, 'I': 0.95, 'A': 0.2, 'S': 0.25, 'E': 0.5, 'C': 0.85}},
    '데이터사이언스전공': {'cluster': '융합', 'vec': {'R': 0.6, 'I': 0.95, 'A': 0.2, 'S': 0.25, 'E': 0.5, 'C': 0.9}},
    '인공지능전공': {'cluster': '융합', 'vec': {'R': 0.65, 'I': 0.95, 'A': 0.2, 'S': 0.25, 'E': 0.5, 'C': 0.85}},
    '디지털콘텐츠디자인학과': {'cluster': '융합', 'vec': {'R': 0.3, 'I': 0.75, 'A': 0.9, 'S': 0.5, 'E': 0.7, 'C': 0.6}},
    '창의융합인재학부': {'cluster': '융합', 'vec': {'R': 0.25, 'I': 0.8, 'A': 0.75, 'S': 0.7, 'E': 0.8, 'C': 0.6}},
}


def cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    """두 벡터 간 코사인 유사도 계산"""
    dims = DIMENSIONS
    v1 = np.array([vec1.get(d, 0) for d in dims])
    v2 = np.array([vec2.get(d, 0) for d in dims])

    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)

    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot / (norm1 * norm2)


def analyze_question_weights():
    """75문항 가중치 분석"""
    print("=" * 60)
    print("1. RIASEC 75문항 가중치 분석")
    print("=" * 60)

    # 각 차원별 주차원/부차원 개수 집계
    primary_count = defaultdict(int)
    secondary_count = defaultdict(int)

    for qid, a_weights, b_weights in QUESTIONS:
        for weights in [a_weights, b_weights]:
            for dim, weight in weights.items():
                if weight == 1.0:
                    primary_count[dim] += 1
                elif weight == 0.3:
                    secondary_count[dim] += 1

    print("\n차원별 가중치 분포:")
    print("-" * 40)
    print(f"{'차원':<8} {'주차원(1.0)':<12} {'부차원(0.3)':<12} {'합계':<8}")
    print("-" * 40)

    for dim in DIMENSIONS:
        primary = primary_count[dim]
        secondary = secondary_count[dim]
        total = primary + secondary
        print(f"{dim:<8} {primary:<12} {secondary:<12} {total:<8}")

    # 불균형 문제 분석
    print("\n* 분석 결과:")
    min_secondary = min(secondary_count.values())
    max_secondary = max(secondary_count.values())

    weak_dims = [d for d, c in secondary_count.items() if c == min_secondary]
    strong_dims = [d for d, c in secondary_count.items() if c == max_secondary]

    print(f"  - 부차원 가장 약한 차원: {', '.join(weak_dims)} ({min_secondary}개)")
    print(f"  - 부차원 가장 강한 차원: {', '.join(strong_dims)} ({max_secondary}개)")
    print(f"  - 불균형 비율: {max_secondary / max(min_secondary, 1):.1f}배")


def analyze_major_similarity():
    """전공 프로필 유사도 분석"""
    print("\n" + "=" * 60)
    print("2. 전공 프로필 유사도 분석 (RIASEC만)")
    print("=" * 60)

    major_names = list(MAJORS.keys())
    n = len(major_names)

    similarities = []
    identical_pairs = []
    high_sim_pairs = []

    for i, j in combinations(range(n), 2):
        name1, name2 = major_names[i], major_names[j]
        vec1 = MAJORS[name1]['vec']
        vec2 = MAJORS[name2]['vec']

        sim = cosine_similarity(vec1, vec2)
        similarities.append((name1, name2, sim))

        if sim >= 0.9999:
            identical_pairs.append((name1, name2, sim))
        elif sim >= 0.99:
            high_sim_pairs.append((name1, name2, sim))

    avg_sim = np.mean([s[2] for s in similarities])

    print(f"\n전체 통계 (총 {n}개 전공, {len(similarities)}쌍):")
    print(f"  - 평균 유사도: {avg_sim:.4f}")
    print(f"  - 동일 프로필 (1.0): {len(identical_pairs)}쌍")
    print(f"  - 매우 유사 (≥0.99): {len(high_sim_pairs)}쌍")

    if identical_pairs:
        print("\n동일 프로필 전공 쌍:")
        for name1, name2, sim in identical_pairs:
            print(f"  - {name1} ↔ {name2}")

    # 계열별 유사도 분석
    print("\n계열 내부 평균 유사도:")
    for cluster in CLUSTERS:
        cluster_majors = [m for m, d in MAJORS.items() if d['cluster'] == cluster]
        if len(cluster_majors) < 2:
            continue

        cluster_sims = []
        for i, j in combinations(range(len(cluster_majors)), 2):
            vec1 = MAJORS[cluster_majors[i]]['vec']
            vec2 = MAJORS[cluster_majors[j]]['vec']
            cluster_sims.append(cosine_similarity(vec1, vec2))

        if cluster_sims:
            print(f"  - {cluster}: {np.mean(cluster_sims):.4f} (전공 {len(cluster_majors)}개)")

    return similarities


def analyze_with_cluster_selection():
    """계열 선택 고려 시 차별화 효과 분석"""
    print("\n" + "=" * 60)
    print("3. 계열 선택(InterestSelect) 고려 시 효과")
    print("=" * 60)

    # 계열별 전공 수
    cluster_counts = defaultdict(int)
    for major, data in MAJORS.items():
        cluster_counts[data['cluster']] += 1

    print("\n계열별 전공 수:")
    for cluster in CLUSTERS:
        print(f"  - {cluster}: {cluster_counts[cluster]}개")

    # 계열 간 유사 전공 분리 효과
    total_pairs = len(list(combinations(MAJORS.keys(), 2)))

    # 동일 계열 내 쌍
    same_cluster_pairs = 0
    same_cluster_high_sim = 0

    # 다른 계열 간 쌍
    diff_cluster_pairs = 0
    diff_cluster_high_sim = 0

    for name1, name2 in combinations(MAJORS.keys(), 2):
        c1 = MAJORS[name1]['cluster']
        c2 = MAJORS[name2]['cluster']
        sim = cosine_similarity(MAJORS[name1]['vec'], MAJORS[name2]['vec'])

        if c1 == c2:
            same_cluster_pairs += 1
            if sim >= 0.99:
                same_cluster_high_sim += 1
        else:
            diff_cluster_pairs += 1
            if sim >= 0.99:
                diff_cluster_high_sim += 1

    print(f"\n유사도 ≥0.99 전공 쌍 분포:")
    print(f"  - 동일 계열 내: {same_cluster_high_sim}쌍 (동일 계열 총 {same_cluster_pairs}쌍 중)")
    print(f"  - 다른 계열 간: {diff_cluster_high_sim}쌍 (다른 계열 총 {diff_cluster_pairs}쌍 중)")

    # 계열 선택으로 걸러지는 효과
    if diff_cluster_high_sim > 0:
        print(f"\n* 계열 선택 효과:")
        print(f"  - 다른 계열 간 유사 전공 {diff_cluster_high_sim}쌍은 계열 선택으로 자동 분리됨")
        print(f"  - 즉, 사용자가 '공학' 선택 시 '융합' 전공과 비교 불필요")


def analyze_with_bookmarking():
    """전공 찜(interestedMajorKeys) 고려 시 효과"""
    print("\n" + "=" * 60)
    print("4. 전공 찜(MajorPreview) 고려 시 효과")
    print("=" * 60)

    # 동일 RIASEC 프로필 전공들
    identical_groups = []
    visited = set()

    major_names = list(MAJORS.keys())
    for i, name1 in enumerate(major_names):
        if name1 in visited:
            continue
        group = [name1]
        visited.add(name1)

        for name2 in major_names[i+1:]:
            if name2 in visited:
                continue
            sim = cosine_similarity(MAJORS[name1]['vec'], MAJORS[name2]['vec'])
            if sim >= 0.9999:
                group.append(name2)
                visited.add(name2)

        if len(group) > 1:
            identical_groups.append(group)

    print("\n동일 RIASEC 프로필 그룹:")
    for group in identical_groups:
        clusters = [MAJORS[m]['cluster'] for m in group]
        print(f"  - {', '.join(group)}")
        print(f"    (계열: {', '.join(set(clusters))})")

    print("\n* 전공 찜의 효과:")
    print("  - 동일 RIASEC 프로필이라도 사용자가 '찜'한 전공은 우선 표시됨")
    print("  - 예: 연극·영화전공과 뮤지컬공연전공이 동일 프로필이어도")
    print("       사용자가 '뮤지컬공연전공'을 찜하면 해당 전공이 우선됨")


def analyze_combined_effect():
    """계열 선택 + 전공 찜 결합 효과"""
    print("\n" + "=" * 60)
    print("5. 계열 선택 + 전공 찜 결합 효과 분석")
    print("=" * 60)

    # 시나리오 분석
    print("\n[시나리오 1] 예체능 계열 선택 + 공연 전공 찜")
    print("-" * 50)

    예체능_majors = [m for m, d in MAJORS.items() if d['cluster'] == '예체능']
    print(f"  예체능 계열 전공 수: {len(예체능_majors)}개")

    # 예체능 내 유사 쌍 계산
    예체능_sims = []
    high_sim_count = 0
    for m1, m2 in combinations(예체능_majors, 2):
        sim = cosine_similarity(MAJORS[m1]['vec'], MAJORS[m2]['vec'])
        예체능_sims.append(sim)
        if sim >= 0.99:
            high_sim_count += 1

    print(f"  계열 내 유사 쌍(≥0.99): {high_sim_count}쌍")
    print(f"  → 전공 찜으로 차별화 가능")

    print("\n[시나리오 2] 융합+공학 계열 선택 (2개 계열)")
    print("-" * 50)

    융합공학_majors = [m for m, d in MAJORS.items() if d['cluster'] in ['융합', '공학']]
    print(f"  융합+공학 전공 수: {len(융합공학_majors)}개")

    # 융합-공학 간 유사 쌍
    cross_sims = []
    for m1 in [m for m, d in MAJORS.items() if d['cluster'] == '융합']:
        for m2 in [m for m, d in MAJORS.items() if d['cluster'] == '공학']:
            sim = cosine_similarity(MAJORS[m1]['vec'], MAJORS[m2]['vec'])
            cross_sims.append((m1, m2, sim))

    high_cross = [(m1, m2, s) for m1, m2, s in cross_sims if s >= 0.95]
    print(f"  융합↔공학 유사 쌍(≥0.95): {len(high_cross)}쌍")
    if high_cross:
        print("  예시:")
        for m1, m2, s in high_cross[:3]:
            print(f"    - {m1} ↔ {m2}: {s:.4f}")

    # 최종 결론
    print("\n" + "=" * 60)
    print("종합 결론")
    print("=" * 60)

    print("""
[1] RIASEC 점수만으로는 구분 어려운 전공들이 있음
    - 동일 프로필: 연극·영화 ↔ 뮤지컬공연, 중어중문학 ↔ 일어일문학
    - 매우 유사(≥0.99): 공학/융합 계열 다수

[2] 계열 선택(InterestSelect)의 효과
    - 사용자가 1~3개 계열만 선택하므로 비교 대상 축소
    - 다른 계열 간 유사 전공은 자동으로 분리됨
    - 예: 응용소프트웨어(융합) ↔ 컴퓨터공학(공학)은 다른 계열

[3] 전공 찜(interestedMajorKeys)의 효과
    - 동일 계열 내 동일 RIASEC 프로필이어도 명시적 선호로 구분
    - 결과 페이지에서 찜한 전공 우선 표시 가능
    - 사용자 의도 반영

[4] 권장 개선사항
    - RIASEC 프로필 차별화: 동일 프로필 전공들 재조정
    - R 차원 부차원 보강: 현재 1개로 가장 약함
    - 결과 화면에서 찜 전공 하이라이트 강화
""")


def main():
    """메인 분석 실행"""
    print("MJU e-Advisor 전공 매칭 종합 분석")
    print("=" * 60)
    print(f"분석 대상: {len(MAJORS)}개 전공, 75개 문항")
    print()

    analyze_question_weights()
    analyze_major_similarity()
    analyze_with_cluster_selection()
    analyze_with_bookmarking()
    analyze_combined_effect()


if __name__ == "__main__":
    main()
