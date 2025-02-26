import WFRP_Utility from "./utility-wfrp4e.js";


export default class EffectWfrp4e extends ActiveEffect {
 
  constructor(data, context)
  {
    if (data.id)
    {
      setProperty(data, "flags.core.statusId", data.id)
      delete data.id
    }
    super(data, context)
  }



  // Some dialog choice effects need to run a script to modify their bonus amounts or description
  prepareDialogChoice() {
    let effect = this.toObject()
    return this._handleDialogChoiceScript.bind(effect)()
  }

  _handleDialogChoiceScript()
  {
    for (let mod in this.flags.wfrp4e.effectData) {
      try {
        if (mod != "description")
          this.flags.wfrp4e.effectData[mod] = eval(this.flags.wfrp4e.effectData[mod])
      }
      catch (e) {
        console.error("Error parsing dialogChoice effect")
        this.flags.wfrp4e.effectData[mod] = ""
      }
    }
    if (this.flags.wfrp4e.script)
      new Function(this.flags.wfrp4e.script).bind(this)()
    return this.flags.wfrp4e.effectData
  }


  // _preCreate(data, options, user)
  // {
  //   console.log(data, options, user)
  //   super._preCreate(data, options, user)
  // }

  get item() {
    if (this.origin && this.parent.documentName == "Actor") // If effect comes from an item
    {
      let origin = this.origin.split(".")
      let id = origin[origin.length - 1]
      return this.parent.items.get(id)
    }
    else if (this.parent.documentName == "Item")
      return this.parent
  }

  /** @override */
  get sourceName()
  {
    let sourceName = super.sourceName
    if (sourceName == "Unknown")
    {
      let sourceItem = this.item
      if (sourceItem)
        sourceName = sourceItem.name;
      if (sourceItem && sourceItem.type == "disease" && !game.user.isGM)
        sourceName = "???";
    }
    return sourceName
  }

  get isCondition()
  {
    return CONFIG.statusEffects.map(i => i.id).includes(this.getFlag("core", "statusId"))
  }

  get conditionId(){
    return this.getFlag("core", "statusId")
  }

  get isNumberedCondition() {
    return Number.isNumeric(this.conditionValue)
  }

  get show() {
    if (game.user.isGM || !this.getFlag("wfrp4e", "hide"))
      return true
    else 
      return false
  }

  // If an effect requires target -> apply, but doesn't have an item associated with it
  get isTargeted() {
    return (this.application == "apply" || this.trigger == "invoke")
  }


  get application() {
    return getProperty(this, "flags.wfrp4e.effectApplication")
  }

  get trigger() {
    return getProperty(this, "flags.wfrp4e.effectTrigger")
  }

  get conditionTrigger() {
    return getProperty(this, "flags.wfrp4e.trigger")
  }

  get script() {
    return getProperty(this, "flags.wfrp4e.script")
  }


  get statusId() {
    return getProperty(this, "flags.core.statusId")
  }

  get conditionValue() {
    return getProperty(this, "flags.wfrp4e.value")
  }

  get reduceQuantity() {
    return this.parent?.type == "trapping" && getProperty(this, "flags.wfrp4e.reduceQuantity")
  }

  reduceItemQuantity() {
    if (this.reduceQuantity && this.item)
    {
      if (this.item.quantity.value > 0)
        this.item.update({"system.quantity.value" : this.item.quantity.value - 1})
      else 
        throw ui.notifications.error(game.i18n.localize("EFFECT.QuantityError"))
    }  
  }

  get displayLabel() {
    if (this.count > 1)
      return this.label + ` (${this.count})`
    else return this.label
  }

  get specifier() {
    return this.label.substring(this.label.indexOf("(") + 1, this.label.indexOf(")"))
  }

}
