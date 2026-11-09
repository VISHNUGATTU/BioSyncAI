"""
BioSync AI - Phase 3: Cultural & Indo-Metabolic Engine
Module: kds_formatter.py

Cloud Kitchen Display System (KDS) & Thermal Printer Ticket Formatter:
Translates vital-constrained recipe modifications and food sequencing plans
into standardized kitchen display tickets and ESC/POS thermal printer commands.
"""

from typing import Dict, Any, List, Optional
import hashlib
from datetime import datetime


class KDSFormatter:
    """
    Formats kitchen tickets with health modifications and box-packaging instructions.
    """

    @classmethod
    def generate_kitchen_ticket(
        cls,
        order_number: str,
        restaurant_name: str,
        order_mode: str,
        items: List[Dict[str, Any]],
        mitigation_plan: Optional[Dict[str, Any]] = None,
        family_allocation: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generates structured KDS JSON and ESC/POS plain-text print commands.
        """
        timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")
        mitigation_plan = mitigation_plan or {}
        family_allocation = family_allocation or []

        # 1. Generate Plain-Text ESC/POS Kitchen Slip
        lines = []
        lines.append("================================================")
        lines.append(f"  {restaurant_name.upper()}")
        lines.append("       BIOSYNC AI - VITAL COMMERCE ENGINE       ")
        lines.append("================================================")
        lines.append(f"TICKET: {order_number}")
        lines.append(f"TIME:   {timestamp_str}")
        lines.append(f"MODE:   {'[GUARD PROTECTED]' if order_mode == 'VITALS_GUARD' else '[CHEAT MODE OVERRIDE]'}")
        lines.append("------------------------------------------------")
        lines.append("QTY  ITEM                         MODIFICATIONS")
        lines.append("------------------------------------------------")

        kitchen_modifications_count = 0
        formatted_items = []

        for it in items:
            name = it.get("name", "Dish")
            qty = it.get("quantity", 1)
            mods = it.get("appliedModifications") or []

            mod_labels = []
            for m in mods:
                label = m.get("label") if isinstance(m, dict) else str(m)
                mod_labels.append(label)
                kitchen_modifications_count += 1

            mod_str = " | ".join(mod_labels) if mod_labels else "Standard Recipe"
            lines.append(f"{qty:2d}x  {name[:28]:<28}")
            if mod_labels:
                for ml in mod_labels:
                    lines.append(f"     >> [AUTO-MOD]: {ml}")

            formatted_items.append({
                "dishName": name,
                "quantity": qty,
                "modifications": mod_labels
            })

        lines.append("------------------------------------------------")

        # 2. Box Packaging Stickers (Pre-Bite Food Sequencing Instructions)
        packaging_stickers = []
        if mitigation_plan.get("preBiteSequencing"):
            lines.append("ATTN PACKING STAFF: ATTACH FOOD SEQUENCING LABEL")
            seq = mitigation_plan["preBiteSequencing"]
            for step in seq:
                st_text = f"Step {step.get('stepNumber')}: {step.get('instructions')}"
                lines.append(f"  * {st_text[:44]}")
                packaging_stickers.append(st_text)

        # 3. Family Plating Instructions (if multi-portion order)
        family_stickers = []
        if family_allocation:
            lines.append("------------------------------------------------")
            lines.append("MULTI-GENERATIONAL FAMILY PLATING GUIDE:")
            for m in family_allocation:
                m_name = m.get("memberName") or m.get("relation") or "Member"
                m_weight = m.get("allocatedTotalWeightGrams") or m.get("allocatedPortionWeightGrams") or 0
                pl_str = f"{m_name} ({m.get('clinicalCondition', 'Health')}): {m_weight}g plate"
                lines.append(f"  * {pl_str}")
                family_stickers.append(pl_str)

        lines.append("================================================")
        lines.append("   THANK YOU FOR PRESERVING METABOLIC HEALTH    ")
        lines.append("================================================")

        raw_ticket_text = "\n".join(lines)

        # Cryptographic Hash for Food Custody Ledger
        ticket_hash = hashlib.sha256(raw_ticket_text.encode("utf-8")).hexdigest()

        return {
            "success": True,
            "orderNumber": order_number,
            "restaurantName": restaurant_name,
            "orderMode": order_mode,
            "timestamp": timestamp_str,
            "totalModificationsApplied": kitchen_modifications_count,
            "items": formatted_items,
            "packagingStickers": packaging_stickers,
            "familyPlatingStickers": family_stickers,
            "escposRawTicket": raw_ticket_text,
            "cryptographicTicketHash": ticket_hash
        }


kds_formatter = KDSFormatter()
