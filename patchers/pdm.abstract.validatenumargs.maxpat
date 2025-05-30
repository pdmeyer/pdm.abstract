{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 9,
			"minor" : 0,
			"revision" : 7,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 84.0, 144.0, 1000.0, 755.0 ],
		"gridsize" : [ 15.0, 15.0 ],
		"integercoordinates" : 1,
		"boxes" : [ 			{
				"box" : 				{
					"id" : "obj-2",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 50.0, 68.0, 22.0, 22.0 ],
					"text" : "t b"
				}

			}
, 			{
				"box" : 				{
					"comment" : "",
					"id" : "obj-1",
					"index" : 1,
					"maxclass" : "inlet",
					"numinlets" : 0,
					"numoutlets" : 1,
					"outlettype" : [ "bang" ],
					"patching_rect" : [ 50.0, 25.0, 30.0, 30.0 ]
				}

			}
, 			{
				"box" : 				{
					"code" : "const tp = this.patcher;\r\nconst tpp = tp.parentpatcher;\r\n\r\nfunction bang() {\r\n\tlet ptext = tp.box.boxtext.split(\" \");\r\n\tlet pname = ptext[0]\r\n\tlet pargs = ptext.slice(1,ptext.length)\r\n\tlet reqArgCount = pargs[0];\r\n\tif(isNaN(reqArgCount) || Number(reqArgCount) < 0) {\r\n\t\terror(pname+':', 'Invalid argument. Argument must be an integer greater than 0.')\r\n\t} else {\r\n\t\treqArgCount = parseInt(reqArgCount);\r\n\t}\r\n\t\r\n\tlet pptext = tpp.box.boxtext.split(\" \");\r\n\tlet ppargs = pptext.slice(1,pptext.length)\r\n\tlet ppname = ptext.slice(0, 1)\r\n\t\r\n\tif(ppargs.length < reqArgCount) {\r\n\t\terror(ppname+':', 'Insufficient arguments. Requires', reqArgCount, 'three arguments.\\n')\r\n\t} else { \r\n\t\toutlet(0, ppargs.slice(0, reqArgCount + 1));\r\n\t}\r\n}",
					"filename" : "none",
					"fontface" : 0,
					"fontname" : "<Monospaced>",
					"fontsize" : 12.0,
					"id" : "obj-3",
					"maxclass" : "v8.codebox",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"patching_rect" : [ 50.0, 97.0, 771.0, 376.0 ],
					"saved_object_attributes" : 					{
						"parameter_enable" : 0
					}

				}

			}
, 			{
				"box" : 				{
					"comment" : "",
					"id" : "obj-17",
					"index" : 1,
					"maxclass" : "outlet",
					"numinlets" : 1,
					"numoutlets" : 0,
					"patching_rect" : [ 50.0, 482.0, 30.0, 30.0 ]
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-2", 0 ],
					"source" : [ "obj-1", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-3", 0 ],
					"source" : [ "obj-2", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-17", 0 ],
					"source" : [ "obj-3", 0 ]
				}

			}
 ]
	}

}
