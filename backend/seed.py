"""
seed.py — Project Evaluator Demo Data
=====================================
Populates the local SQLite database with 6 fictional users, 8 cybersecurity projects,
and realistic ratings that demonstrate:
  - Clear ranking differences
  - AI SOC Analyst at #1
  - Near-tie between Attack Path and Malware Observatory (tiebreak by Demo)
  - Varied voter counts (shows sample size labels)
  - Activity history

Run:  python seed.py
Idempotent — safe to run multiple times.
"""

import json
from database import get_supabase

# ─── Deterministic rating tables ──────────────────────────────────────────────
RATINGS: dict[str, dict[str, dict[str, int]]] = {
    "AI SOC Analyst": {
        "TITAN":     {"demo": 93, "time": 88, "technical_depth": 91, "influence": 90, "authenticity": 85, "simplicity": 88, "market": 92, "scalability": 87},
        "ULTRON":   {"demo": 91, "time": 85, "technical_depth": 89, "influence": 87, "authenticity": 82, "simplicity": 90, "market": 88, "scalability": 84},
        "CYBERFOX": {"demo": 95, "time": 90, "technical_depth": 92, "influence": 91, "authenticity": 88, "simplicity": 86, "market": 94, "scalability": 89},
        "ROOT":     {"demo": 90, "time": 87, "technical_depth": 88, "influence": 89, "authenticity": 84, "simplicity": 85, "market": 90, "scalability": 86},
        "ZERO":     {"demo": 92, "time": 89, "technical_depth": 93, "influence": 88, "authenticity": 87, "simplicity": 89, "market": 91, "scalability": 88},
    },
    "Attack Path Intelligence Engine": {
        "NEXUS":    {"demo": 91, "time": 84, "technical_depth": 94, "influence": 86, "authenticity": 90, "simplicity": 78, "market": 82, "scalability": 90},
        "ULTRON":   {"demo": 89, "time": 82, "technical_depth": 92, "influence": 84, "authenticity": 88, "simplicity": 76, "market": 80, "scalability": 88},
        "CYBERFOX": {"demo": 92, "time": 86, "technical_depth": 95, "influence": 87, "authenticity": 91, "simplicity": 80, "market": 84, "scalability": 92},
        "ROOT":     {"demo": 90, "time": 83, "technical_depth": 91, "influence": 85, "authenticity": 89, "simplicity": 77, "market": 81, "scalability": 89},
        "ZERO":     {"demo": 90, "time": 85, "technical_depth": 93, "influence": 86, "authenticity": 90, "simplicity": 79, "market": 83, "scalability": 91},
    },
    "Malware Behavior Observatory": {
        "NEXUS":    {"demo": 88, "time": 83, "technical_depth": 90, "influence": 84, "authenticity": 86, "simplicity": 82, "market": 79, "scalability": 83},
        "TITAN":     {"demo": 87, "time": 82, "technical_depth": 89, "influence": 83, "authenticity": 85, "simplicity": 81, "market": 78, "scalability": 82},
        "CYBERFOX": {"demo": 89, "time": 85, "technical_depth": 91, "influence": 86, "authenticity": 87, "simplicity": 83, "market": 81, "scalability": 85},
        "ROOT":     {"demo": 87, "time": 83, "technical_depth": 88, "influence": 84, "authenticity": 85, "simplicity": 80, "market": 79, "scalability": 83},
    },
    "Autonomous Incident Response": {
        "NEXUS":    {"demo": 85, "time": 90, "technical_depth": 82, "influence": 88, "authenticity": 80, "simplicity": 91, "market": 86, "scalability": 84},
        "TITAN":     {"demo": 84, "time": 88, "technical_depth": 81, "influence": 87, "authenticity": 79, "simplicity": 90, "market": 85, "scalability": 83},
        "ULTRON":   {"demo": 86, "time": 89, "technical_depth": 83, "influence": 87, "authenticity": 81, "simplicity": 92, "market": 87, "scalability": 85},
    },
    "Cybersecurity Digital Twin": {
        "NEXUS":    {"demo": 80, "time": 72, "technical_depth": 88, "influence": 82, "authenticity": 91, "simplicity": 70, "market": 77, "scalability": 88},
        "TITAN":     {"demo": 79, "time": 71, "technical_depth": 87, "influence": 81, "authenticity": 90, "simplicity": 69, "market": 76, "scalability": 87},
        "ULTRON":   {"demo": 81, "time": 73, "technical_depth": 89, "influence": 83, "authenticity": 92, "simplicity": 71, "market": 78, "scalability": 89},
        "ZERO":     {"demo": 80, "time": 72, "technical_depth": 88, "influence": 82, "authenticity": 91, "simplicity": 70, "market": 77, "scalability": 88},
    },
    "Endpoint Behavioral Detection": {
        "NEXUS":    {"demo": 82, "time": 85, "technical_depth": 80, "influence": 79, "authenticity": 78, "simplicity": 87, "market": 84, "scalability": 81},
        "TITAN":     {"demo": 81, "time": 84, "technical_depth": 79, "influence": 78, "authenticity": 77, "simplicity": 86, "market": 83, "scalability": 80},
    },
    "Threat Intelligence Correlation Engine": {
        "TITAN":     {"demo": 78, "time": 75, "technical_depth": 83, "influence": 80, "authenticity": 79, "simplicity": 74, "market": 81, "scalability": 85},
        "ULTRON":   {"demo": 77, "time": 74, "technical_depth": 82, "influence": 79, "authenticity": 78, "simplicity": 73, "market": 80, "scalability": 84},
        "CYBERFOX": {"demo": 79, "time": 76, "technical_depth": 84, "influence": 81, "authenticity": 80, "simplicity": 75, "market": 82, "scalability": 86},
    },
    "Adaptive Network Defense": {
        "NEXUS":    {"demo": 74, "time": 79, "technical_depth": 76, "influence": 75, "authenticity": 73, "simplicity": 81, "market": 77, "scalability": 79},
        "ULTRON":   {"demo": 73, "time": 78, "technical_depth": 75, "influence": 74, "authenticity": 72, "simplicity": 80, "market": 76, "scalability": 78},
    },
}

PROJECTS_DATA = [
    {
        "creator_nick": "NEXUS",
        "name": "AI SOC Analyst",
        "tagline": "Your tireless Tier-1 analyst, powered by AI",
        "problem": "Security Operations Centers are drowning in alerts. Analysts spend 80% of their time on false positives, leaving real threats undetected.",
        "solution": "An AI-powered SOC assistant that automatically triages incoming SIEM alerts, correlates related events, enriches indicators against threat intel feeds, and produces a human-readable incident report.",
        "target_users": "Mid-market enterprises and MSSPs with overwhelmed SOC teams.",
        "domain": "Security Analytics",
        "features": "Real-time alert triage and scoring\nAutomatic IOC enrichment\nIncident correlation across 48-hour windows\nPlain-language investigation reports",
        "tech_stack": "Python FastAPI backend\nElasticsearch for SIEM log ingestion\nRedis for alert deduplication\nReact + Tailwind frontend",
        "mvp_plan": "Week 1: SIEM log ingestion pipeline\nWeek 2: Alert scoring and deduplication engine\nWeek 3: AI triage and report generation\nWeek 4: IOC enrichment API integrations\nWeek 5: Web dashboard",
        "future_potential": "Full SOC automation platform covering incident response playbooks, ticketing integration, and custom detection rule suggestions.",
        "hidden": False,
    },
    {
        "creator_nick": "TITAN",
        "name": "Attack Path Intelligence Engine",
        "tagline": "Find the kill chain before attackers do",
        "problem": "Enterprise networks have thousands of misconfigurations, credentials, and trust relationships. Attackers use graph-based lateral movement to reach critical assets.",
        "solution": "A graph-based attack path analyzer that ingests network topology, Active Directory data, and vulnerability scan results, then computes all viable attack paths.",
        "target_users": "Red teams, penetration testers, and security architects.",
        "domain": "Threat Intelligence",
        "features": "Neo4j graph database for network topology\nAD enumeration via BloodHound-compatible data\nAttack path scoring by likelihood and impact",
        "tech_stack": "Python backend (FastAPI)\nNeo4j graph database\nReact + D3.js for graph visualization",
        "mvp_plan": "Week 1: Data model and Neo4j schema\nWeek 2: AD enumeration parser\nWeek 3: Attack path computation algorithm\nWeek 4: D3.js interactive visualization\nWeek 5: Scoring engine + demo",
        "future_potential": "Enterprise product with continuous monitoring, automated remediation prioritization, and integration into popular SIEM/SOAR platforms.",
        "hidden": False,
    },
    {
        "creator_nick": "ULTRON",
        "name": "Malware Behavior Observatory",
        "tagline": "Understand what malware actually does",
        "problem": "Traditional antivirus relies on signatures that miss zero-day malware.",
        "solution": "An automated behavioral analysis sandbox that executes suspicious binaries in isolated VMs, captures system calls, network traffic, file operations, and registry changes.",
        "target_users": "Malware analysts, threat intelligence teams, and security researchers.",
        "domain": "Malware Analysis",
        "features": "KVM-based isolated execution sandbox\nSystem call interception via eBPF\nNetwork traffic capture and DPI",
        "tech_stack": "Python backend\nKVM + QEMU for virtualization\neBPF for syscall monitoring\nReact dashboard",
        "mvp_plan": "Week 1: KVM sandbox environment setup\nWeek 2: eBPF-based system call interceptor\nWeek 3: Network capture\nWeek 4: MITRE ATT&CK mapper\nWeek 5: Web UI + demo",
        "future_potential": "Commercial sandboxing service competing with Joe Sandbox / Any.run.",
        "hidden": False,
    },
    {
        "creator_nick": "CYBERFOX",
        "name": "Autonomous Incident Response",
        "tagline": "Contain threats in seconds, not hours",
        "problem": "Manual incident response is slow, inconsistent, and error-prone.",
        "solution": "A SOAR-lite platform that defines incident response playbooks as code and autonomously executes containment actions.",
        "target_users": "SOC teams and security engineers.",
        "domain": "Incident Response",
        "features": "Playbook-as-code\nReal-time SIEM alert consumption\nAutomated host/user containment",
        "tech_stack": "Python (FastAPI + Celery)\nRedis task queue\nReact dashboard",
        "mvp_plan": "Week 1: Playbook engine\nWeek 2: SIEM alert consumer\nWeek 3: Action modules\nWeek 4: Approval gate\nWeek 5: Dashboard + audit log",
        "future_potential": "Full SOAR platform with community-contributed playbook marketplace.",
        "hidden": False,
    },
    {
        "creator_nick": "ROOT",
        "name": "Cybersecurity Digital Twin",
        "tagline": "Simulate your entire network before attackers do",
        "problem": "Security teams cannot test defenses against real attacks without risking production systems.",
        "solution": "A digital twin of the enterprise network that continuously mirrors real topology and allows red team simulations.",
        "target_users": "Enterprise security architects and red teams.",
        "domain": "Network Security",
        "features": "Automated topology discovery\nRisk simulation engine\nQuantified risk scores per asset",
        "tech_stack": "Python backend\nTerraform + AWS for isolated twin environments\nReact + D3.js visualization",
        "mvp_plan": "Week 1: CMDB integration\nWeek 2: Automated twin environment provisioning\nWeek 3: Risk simulation engine\nWeek 4: Topology visualization\nWeek 5: Continuous sync + demo",
        "future_potential": "Cloud-native risk management platform.",
        "hidden": False,
    },
    {
        "creator_nick": "ZERO",
        "name": "Endpoint Behavioral Detection",
        "tagline": "Catch threats by what they do, not who they are",
        "problem": "Signature-based endpoint detection misses novel malware.",
        "solution": "A lightweight endpoint agent that uses machine learning to build behavioral baselines and detect anomalies.",
        "target_users": "Enterprise security teams managing endpoint fleets.",
        "domain": "Application Security",
        "features": "Lightweight agent\nProcess tree analysis and scoring\nML baseline per endpoint",
        "tech_stack": "C++ / Python agents\nScikit-learn Isolation Forest\nReact dashboard",
        "mvp_plan": "Week 1: Process monitoring agent\nWeek 2: Baseline learning engine\nWeek 3: Anomaly scoring pipeline\nWeek 4: Telemetry streaming\nWeek 5: Dashboard + demo",
        "future_potential": "Enterprise EDR product with threat hunting interface.",
        "hidden": False,
    },
    {
        "creator_nick": "NEXUS",
        "name": "Threat Intelligence Correlation Engine",
        "tagline": "Turn raw threat data into actionable intelligence",
        "problem": "Organizations consume threat intelligence from dozens of feeds but have no automated way to correlate and prioritize.",
        "solution": "A threat intelligence platform that ingests STIX/TAXII feeds, deduplicates IOCs, and scores relevance against inventory.",
        "target_users": "Threat intelligence analysts and SOC teams.",
        "domain": "Threat Intelligence",
        "features": "STIX/TAXII 2.1 feed ingestion\nIOC deduplication and scoring\nAsset matching",
        "tech_stack": "Python (TAXII client)\nRedis cache\nReact dashboard",
        "mvp_plan": "Week 1: Feed ingestion pipeline\nWeek 2: Deduplication engine\nWeek 3: Asset matching\nWeek 4: Intelligence digest\nWeek 5: Dashboard + demo",
        "future_potential": "Full threat intelligence hub for security ecosystems.",
        "hidden": False,
    },
    {
        "creator_nick": "TITAN",
        "name": "Adaptive Network Defense",
        "tagline": "A firewall that learns from every packet",
        "problem": "Traditional firewalls apply static rules that quickly become outdated.",
        "solution": "A network defense system that learns normal traffic baselines and dynamically adjusts firewall rules.",
        "target_users": "Network security engineers at SMBs.",
        "domain": "Network Security",
        "features": "Passive traffic baseline learning\nDynamic firewall rule generation\nPlain-language rule explanations",
        "tech_stack": "Python (River ML)\nScapy packet capture\nReact dashboard",
        "mvp_plan": "Week 1: Packet capture pipeline\nWeek 2: Baseline ML model\nWeek 3: Dynamic rule generation\nWeek 4: Explanation engine\nWeek 5: Dashboard + demo",
        "future_potential": "Embedded security appliance for SMB routers and cloud VPC gateways.",
        "hidden": False,
    },
]

def seed():
    db = get_supabase()
    print("Starting Project Evaluator seed...")

    # ── Users ──
    USERS = ["NEXUS", "TITAN", "ULTRON", "CYBERFOX", "ROOT", "ZERO"]
    user_ids: dict[str, str] = {}

    for nick in USERS:
        nick_lower = nick.lower()
        existing = db.table('users').select('id').eq('nickname_lower', nick_lower).maybe_single().execute()
        if existing.data:
            user_ids[nick] = existing.data['id']
            print(f"  Existing User: {nick}")
        else:
            res = db.table('users').insert({'nickname': nick, 'nickname_lower': nick_lower}).execute()
            uid = res.data[0]['id']
            user_ids[nick] = uid
            db.table('activities').insert({
                'user_id': uid,
                'action': 'user_joined',
                'metadata': json.dumps({'nickname': nick})
            }).execute()
            print(f"  Created User: {nick}")

    # ── Projects ──
    project_ids: dict[str, str] = {}

    for pd in PROJECTS_DATA:
        creator_nick = pd["creator_nick"]
        proj_name    = pd["name"]
        existing = db.table('projects').select('id').eq('name', proj_name).maybe_single().execute()
        if existing.data:
            project_ids[proj_name] = existing.data['id']
            print(f"  Existing Project: '{proj_name}'")
        else:
            data = {k: v for k, v in pd.items() if k != "creator_nick"}
            data["creator_id"] = user_ids[creator_nick]
            res = db.table('projects').insert(data).execute()
            pid = res.data[0]['id']
            project_ids[proj_name] = pid
            db.table('activities').insert({
                'user_id': user_ids[creator_nick],
                'project_id': pid,
                'action': 'project_submitted',
                'metadata': json.dumps({'project_name': proj_name})
            }).execute()
            print(f"  Created Project: '{proj_name}'")

    # ── Ratings ──
    project_creators: dict[str, str] = {}
    for pd in PROJECTS_DATA:
        project_creators[pd["name"]] = pd["creator_nick"]

    for proj_name, raters in RATINGS.items():
        proj_id = project_ids.get(proj_name)
        if not proj_id:
            continue

        for rater_nick, scores in raters.items():
            rater_id = user_ids.get(rater_nick)
            if not rater_id:
                continue

            if project_creators.get(proj_name) == rater_nick:
                continue

            existing = db.table('ratings').select('id').eq('user_id', rater_id).eq('project_id', proj_id).maybe_single().execute()
            if existing.data:
                continue

            db.table('ratings').insert({
                'user_id':         rater_id,
                'project_id':      proj_id,
                **scores,
            }).execute()

            db.table('activities').insert({
                'user_id':    rater_id,
                'project_id': proj_id,
                'action':     'project_rated',
                'metadata':   json.dumps({'project_name': proj_name})
            }).execute()
            print(f"  Created Rating: {rater_nick} -> '{proj_name}'")

    print("Seed complete!")

if __name__ == "__main__":
    seed()
